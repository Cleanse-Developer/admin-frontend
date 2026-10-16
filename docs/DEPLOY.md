# Deploying the admin panel (`admin-frontend`)

Every push to `main` is **guarded, built in GitHub, and deployed to EC2** by
`.github/workflows/deploy.yml`. Nothing is built on your laptop or on the server.

```
push to main
   |
   v
 guard  ---- scripts/ci-guard.sh: plain shell, runs BEFORE any npm/node code
   |
 build  ---- npm ci --ignore-scripts, npm run build, scripts/package-release.sh -> release.tgz
   |
 deploy ---- (only when DEPLOY_ENABLED=true) assume the AWS role through OIDC,
   |         upload release.tgz to S3, ask the server (SSM) to fetch it and run
   v         deploy/deploy-remote.sh: install deps if the lockfile changed, swap the
 EC2         build, restart pm2, health-check, roll back automatically on failure
```

Pull requests get the guard and the build only (no secrets, no deploy).
**The deploy job stays off until you set `DEPLOY_ENABLED=true`**, so merging this is safe
before AWS is ready: you will just see the build job go green.

There is no SSH, no inbound port and no long-lived AWS key anywhere in this setup.

---

## One-time setup

### 1. AWS

Replace `ACCOUNT_ID`, `REGION`, `BUCKET` and `INSTANCE_ID` below.

**a. S3 bucket for releases.** Private, "Block all public access" on. Add a lifecycle rule
that expires objects under `releases/` after 14 days.

**b. GitHub as an identity provider** (once per AWS account; skip if it exists).
IAM, Identity providers, Add provider: OpenID Connect,
URL `https://token.actions.githubusercontent.com`, audience `sts.amazonaws.com`.

**c. IAM role for this repo**, for example `github-deploy-admin-frontend`.

Trust policy (the `sub` must match exactly, including `environment:production`):

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
        "token.actions.githubusercontent.com:sub": "repo:Cleanse-Developer/admin-frontend:environment:production"
      }
    }
  }]
}
```

Permissions policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::BUCKET/releases/admin-frontend/*" },
    { "Effect": "Allow", "Action": "ssm:SendCommand",
      "Resource": [
        "arn:aws:ssm:REGION::document/AWS-RunShellScript",
        "arn:aws:ec2:REGION:ACCOUNT_ID:instance/INSTANCE_ID"
      ] },
    { "Effect": "Allow", "Action": ["ssm:GetCommandInvocation", "ssm:ListCommandInvocations"],
      "Resource": "*" }
  ]
}
```

**d. Let the server take SSM commands.** The EC2 instance needs an instance profile whose
role has the AWS managed policy `AmazonSSMManagedInstanceCore`. Attach it to the running
instance (EC2, Actions, Security, Modify IAM role). The instance only needs *outbound*
HTTPS. After a minute it should appear under Systems Manager, Fleet Manager as "Online".
The server also needs `curl`, `tar`, `sudo`, node and pm2 (it already has node and pm2).

### 2. GitHub

1. **Settings, Environments, New environment** named `production`. Optional: add yourself
   as a required reviewer so every deploy waits for one click.
2. **Settings, Secrets and variables, Actions, Variables.** No secrets are needed.

| Variable | Value |
|---|---|
| `DEPLOY_ENABLED` | `true` (set last, when everything else is ready) |
| `AWS_DEPLOY_ROLE_ARN` | ARN of the role from step 1c |
| `AWS_REGION` | e.g. `ap-south-1` |
| `DEPLOY_BUCKET` | the bucket from step 1a |
| `EC2_INSTANCE_ID` | `i-...` of the server |
| `APP_DIR` | folder of the running app, e.g. `/home/ubuntu/admin-frontend` |
| `APP_USER` | user that owns that folder and runs pm2 (default `ubuntu`) |
| `PM2_PROCESS` | pm2 process name, from `pm2 list`, e.g. `admin-frontend` |
| `HEALTH_URL` | **required**: an address on the server that returns 200 when the admin is up (check the port it listens on, e.g. `http://127.0.0.1:3001/`) |

**Required build-time variable.** The admin has no committed env files, so its API address must
come from here (a stray `.env.local` pointing at a LAN address can no longer leak into a release):

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_API_URL` | **required**, public `https://` address of the API, e.g. `https://d6mvnylha0j3u.cloudfront.net/api`. The build refuses localhost / private addresses |

3. **Recommended:** Settings, Branches, protect `main`: require a pull request, block force
   pushes. A forged force-push is how the earlier compromise spread.

### 3. On the server, once

```bash
cd /home/ubuntu/admin-frontend
pm2 list                                   # confirm the process name for PM2_PROCESS
# Skip the first dependency reinstall if node_modules already matches the lockfile:
sha256sum package-lock.json | cut -d' ' -f1 > .deploy-lock-hash
```

### 4. First deploy

**Dry run first** (works even while `DEPLOY_ENABLED` is unset): Actions, "Build and deploy",
**Run workflow**, tick **Dry run**. It builds, uploads to S3, and runs the real deploy script on the
server, which downloads and inspects the release, prints what it *would* do, and exits without
changing anything. A green dry run proves the role, bucket, SSM and the server prerequisites.

Then set `DEPLOY_ENABLED=true`; the next push to `main` (or **Run workflow** without the tick)
deploys for real. The log shows the server output. A failed health check rolls back on its own
and fails the run.

---

## What happens on the server

`deploy/deploy-remote.sh` (shipped inside every release, tested for success, unchanged
lockfile and rollback):

1. `public/` is large (about 200 MB of images) and rarely changes, so it is **not** part of the
   build artifact. The deploy job uploads it to S3 once per change (named after its git tree hash)
   and the server downloads it only when that hash differs from the last deploy.
2. If `package-lock.json` changed, `npm ci --omit=dev --ignore-scripts` into a staging
   folder and swap `node_modules` only if it succeeded.
3. Move the live `.next` to `.next.prev`, move the new one in (the image cache is carried
   over), swap `public/` if it changed, copy the config files.
4. `pm2 restart` and poll `HEALTH_URL` for up to a minute.
5. Healthy: done, `.next.prev` stays for a manual rollback. Not healthy: everything is put
   back, pm2 restarted, and the run fails.

Files the deploy never touches: `.env`, `.env.local`, and anything else not listed above.

## Rollback

* **Automatic** if the health check fails.
* **Last good build, by hand:**
  `cd /home/ubuntu/admin-frontend && rm -rf .next && mv .next.prev .next && pm2 restart admin-frontend`
* **Any older commit:** Actions, open the old run, "Re-run all jobs". Artifacts are kept
  for 14 days.

## What changes for the server

The admin repo never tracked `.next`, so whatever you did on the host before (building there)
stops: the workflow now ships a finished build. Keep the host's `.env` / `.env.local` if you
like; they no longer influence the build (`NEXT_PUBLIC_*` values are baked in by CI).

## Security notes

* `scripts/ci-guard.sh` fails the run, before anything is installed, if a config file has
  a payload hidden behind whitespace or uses `eval` / `child_process`, if `package.json`
  gains a lifecycle script or a `node ... && next build` style script, or if the lockfile
  resolves anything outside registry.npmjs.org.
* Dependencies install with `--ignore-scripts`, in CI and on the server.
* Actions are pinned to full commit SHAs. `.github/dependabot.yml` opens a weekly PR to
  bump them; read the diff before merging.
* The deploy job only runs on `main`, only in the `production` environment, and the role's
  trust policy only accepts that exact repo and environment.
* The server downloads the release from a 15-minute presigned link, so it needs no S3
  permissions of its own.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `Not authorized to perform sts:AssumeRoleWithWebIdentity` | trust policy `sub` does not match `repo:Cleanse-Developer/admin-frontend:environment:production`, or the OIDC provider is missing |
| SSM command stays `Pending` / `InvalidInstanceId` | instance has no `AmazonSSMManagedInstanceCore` role, or is not "Online" in Fleet Manager |
| `pm2: command not found` on the server | pm2 is installed under nvm for a different user: check `APP_USER`; the script sources `~/.nvm/nvm.sh` |
| Health check fails and rolls back | wrong `PM2_PROCESS` or `HEALTH_URL` port; run `pm2 logs admin-frontend` |
| `ci-guard` fails | read the `::error` line; it names the file. If it is a real change you made, adjust `scripts/ci-guard.sh` deliberately |
