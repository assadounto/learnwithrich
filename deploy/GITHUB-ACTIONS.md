# GitHub Actions deployment

This workflow deploys the selected `main` commit to LearnWithRich on the VPS at `187.77.170.99`. It is manual at first so the initial live deployment is deliberate. It uses the repository's production Compose file and builds the web and tools images on the VPS.

## Server prerequisites

The deployment directory must already contain a clone of this repository, `docker-compose.prod.yml`, and a valid `.env.production`. Follow [DOCKER.md](DOCKER.md) for the production environment, PostgreSQL, S3, Google OAuth, and Paystack settings.

Before running the workflow, confirm:

- Docker Engine and the Compose plugin are installed.
- The external `app_edge` Docker network exists and the Caddy proxy is attached to it.
- The LearnWithRich Caddy route is installed and HTTPS is working. The repository provides `deploy/install-caddy.sh` and `deploy/learnwithrich.caddy`.
- The production app has completed its initial provisioning and can be reached at `https://learnwithrich.com/api/ready`.
- The SSH account can run Docker Compose in the app directory. Docker access grants broad host control, so use a dedicated account and key, protect them, and do not enable root SSH login.

The workflow does not configure DNS, provision the VPS, create `.env.production`, or install Caddy. For a first-ever installation, follow [DOCKER.md](DOCKER.md) on the server first.

## GitHub configuration

In **Settings → Environments**, create an environment named `production`. Add these as environment secrets:

| Secret | Value |
| --- | --- |
| `DEPLOY_HOST` | `187.77.170.99` |
| `DEPLOY_USER` | Dedicated SSH username on the VPS |
| `DEPLOY_SSH_KEY` | Private key for that account |
| `DEPLOY_KNOWN_HOSTS` | Verified known-hosts entry for `187.77.170.99` |
| `DEPLOY_APP_DIR` | Absolute path to the checked-out app directory |

Verify the VPS SSH host-key fingerprint using your hosting provider's console before saving the known-hosts entry. Do not trust an unverified `ssh-keyscan` result.

## Running a release

After this change is merged to `main`, open **Actions → Deploy LearnWithRich → Run workflow** and select `main`. The workflow serializes releases, fetches the exact selected commit, builds both production images, waits for PostgreSQL, writes a pre-migration database dump, applies migrations once, starts the web service, and checks `/api/ready`.

If a build or migration fails, the workflow stops and does not continue to the web update. Review the Actions log and server logs before retrying. This is a restart-based deployment with a short interruption, as described in [DOCKER.md](DOCKER.md).

The dump is kept under `backups/` on the VPS as a release safety point. It does not replace the encrypted off-host backups and restore checks required by [DOCKER.md](DOCKER.md). Keep the existing scheduled off-host backup process in place.
