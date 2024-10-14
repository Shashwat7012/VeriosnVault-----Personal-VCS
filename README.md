
# VersionVault

VersionVault is a lightweight, personal version control system inspired by Git. It provides functionality to track file changes, commit, and view differences between commits in a simple, educational environment.

## Features
- Initialize version control for a directory.
- Add files to a staging area.
- Commit changes with messages.
- View commit history.
- Show detailed diff of file changes using `diffLines`.

## Setup
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the system:
   ```bash
   node yourscript.js
   ```

## Commands
- **Add file:** Adds files to staging.
   ```js
   await versionvault.add('file.txt');
   ```
- **Commit:** Commits staged files with a message.
   ```js
   await versionvault.commit('commit message');
   ```
- **Log:** View the commit history.
   ```js
   await versionvault.log();
   ```
- **Show Diff:** Display differences between current and parent commits.
   ```js
   await versionvault.showCommitDiff('commitHash');
   ```

## Dependencies
- `fs/promises`: For file system operations.
- `crypto`: To generate SHA-1 hashes for file content.
- `diff`: To compare file contents.
- `chalk`: For colored output.

## Future Improvements
- Implement branch management.
- Handle large file changes efficiently.

## License
This project is open-source under the MIT License.
