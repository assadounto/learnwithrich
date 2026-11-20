# GitHub Actions deployment

This workflow deploys the selected `main` commit to LearnWithRich at `learnwithrich.com`, on VPS `187.77.170.99`, as SSH user `root`, from `/opt/learnwithrich`. It is manually triggered so the first live deployment is deliberate. It uses the repository's production Compose file and builds the web and tools images on the VPS.

## Server prerequisites

The directory `/opt/learnwithrich` must already contain a clone of this repository, `docker-compose.prod.yml`, and a valid `.env.production`. Follow [DOCKER.md](DOCKER.md) for the production environment, PostgreSQL, S3, Google OAuth, and Paystack settings.

Before running the workflow, confirm:

- Docker Engine and the Compose plugin are installed.
- The external `app_edge` Docker network exists and the Caddy proxy is attached to it.
- The LearnWithRich Caddy route is installed and HTTPS is working. The repository provides `deploy/install-caddy.sh` and `deploy/learnwithrich.caddy`.
- The production app has completed its initial provisioning and can be reached at `https://learnwithrich.com/api/ready`.
- Root SSH key authentication works from GitHub Actions and the private key is dedicated to this workflow.

The workflow does not configure DNS, provision the VPS, create `.env.production`, or install Caddy. For a first-ever installation, follow [DOCKER.md](DOCKER.md) on the server first.

## GitHub configuration

In **Settings → Environments**, create an environment named `production`. Add these as environment secrets:

| Secret | Value |
| --- | --- |
| `DEPLOY_SSH_KEY` | Private SSH key for the root account, dedicated to this workflow |
| `DEPLOY_KNOWN_HOSTS` | Verified known-hosts entry for `187.77.170.99` |

Root access gives the workflow full control of the VPS. Protect the key as a production credential and configure a required reviewer for the `production` environment before using the workflow. Verify the SSH host-key fingerprint using your hosting provider's console before saving the known-hosts entry; do not trust an unverified `ssh-keyscan` result.

## Running a release

After this change is merged to `main`, open **Actions → Deploy LearnWithRich → Run workflow** and select `main`. The workflow serializes releases, fetches the exact selected commit, builds both production images, waits for PostgreSQL, writes a pre-migration database dump, applies migrations once, starts the web service, and checks `/api/ready`.

If a build or migration fails, the workflow stops and does not continue to the web update. Review the Actions log and server logs before retrying. This is a restart-based deployment with a short interruption, as described in [DOCKER.md](DOCKER.md).

The dump is kept under `/opt/learnwithrich/backups/` on the VPS as a release safety point. It does not replace the encrypted off-host backups and restore checks required by [DOCKER.md](DOCKER.md). Keep the existing scheduled off-host backup process in place.
