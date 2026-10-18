# Asset pipeline branch
**Tool branch with its own history: never merge it into `main` or open a pull request for it.** GitHub's "Compare & pull request" banner after a push can be ignored. Push here only to run a batch (`pipeline/gen.json` or `pipeline/requests.json`).

GitHub Actions relay: files listed in pipeline/requests.json are downloaded and committed to the asset-drop branch. Not deployed.
