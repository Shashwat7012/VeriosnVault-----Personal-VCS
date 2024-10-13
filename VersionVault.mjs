import path from 'path';
import fs from 'fs/promises';
import crypto, { hash } from 'crypto';
import { diffLines } from 'diff';
import chalk from 'chalk';


class VersionVault {
    constructor(repoPath = '.'){
        this.repoPath = path.join(repoPath, '.vv'); // repository where .vv will create
        this.objectsPath = path.join(this.repoPath, 'objects'); // .vv/objects
        this.headPath = path.join(this.repoPath, 'HEAD'); // .vv/HEAD
        this.indexPath = path.join(this.repoPath, 'index'); //staging area
        this.intit();
    }

    async intit(){
        await fs.mkdir(this.objectsPath,{recursive:true}); // objects are in a objects folder. chain of directory , if not available
        try {
            await fs.writeFile(this.headPath, '', {flag: 'wx'}); // it is a file in git, w-> write, x->xlusive :- which can cause the particular file fail it is already exists. Together 'ws -> write only file file does not exsist.
            
            await fs.writeFile(this.indexPath, JSON.stringify([]),{flag: 'wx'});

        } catch (error) {
            console.log("already initialized the vv folder")
        }
    }

    hashObject(content){
        return crypto.createHash('sha1').update(content, 'utf-8').digest('hex'); // git uses same hashing algo.
                                                // for encoding:- utf-8, ascii
                                                // .digest :- calculates the final hash value in the form of hexa-decimal string
                                                // sha1 hash returns us the 40 digit hexa-decimal
    }
// Add
    async add(fileToBeAdded){ // Hash the data first
// fileToBeAdded :- path/to/file
            const fileData = await fs.readFile(fileToBeAdded,{encoding: 'utf-8'}); //read file
            const fileHash = this.hashObject(fileData); // gives us the sha-1 based 40 digits hexadecimal string
            console.log(fileHash);
            const newFileHashedObjectPath = path.join(this.objectsPath, fileHash); // .vv/objects/file
            await fs.writeFile(newFileHashedObjectPath, fileData);

            await this.updateStagingArea(fileToBeAdded,fileHash);


            console.log(`Added ${fileToBeAdded}`);
    }

    //Update
    async updateStagingArea(filePath, fileHash){
         // index is the staging area 
        const index = JSON.parse(await fs.readFile(this.indexPath, {encoding: 'utf-8'})); // read the index file

        index.push({path : filePath, hash: fileHash}); // add the file to the index file
        await fs.writeFile(this.indexPath, JSON.stringify(index)); // write the updated index file
    }

    async commit(message){
        const index = JSON.parse(await fs.readFile(this.indexPath, {encoding: 'utf-8'})); // read the array in index file
        const parentCommit = await this.getCurrentHead();

        const commitData = {
            timeStamp : new Date().toISOString(),
            message,
            files: index,
            parent: parentCommit
        };

        // commit is also a hashed of the data

        const commitHash = this.hashObject(JSON.stringify(commitData));
         const commitPath = path.join(this.objectsPath, commitHash);
         await fs.writeFile(commitPath, JSON.stringify(commitData));
         await fs.writeFile(this.headPath,commitHash);  // update the HEAD to point to the new commit
         await fs.writeFile(this.indexPath, JSON.stringify([])); // clear the staging area
         console.log(`Commit Successfully created : ${commitHash}`);
    }

    async getCurrentHead(){
        try {
            return await fs.readFile(this.headPath, {encoding:'utf-8'});

        } catch (error) {
            return null;
        }
    }

    // logs
    async log(){
        let currentCommitHash = await this.getCurrentHead();
        while(currentCommitHash){
            const commitData = JSON.parse(await fs.readFile(path.join(this.objectsPath, currentCommitHash),{
                encoding:'utf-8' }));

                console.log(`----------------------------------------------`)
                console.log(`Commit: ${currentCommitHash}\nDate : ${commitData.timeStamp}\n\n${commitData.message}\n\n`);

                currentCommitHash = commitData.parent;
        }
    }

    async showCommitDiff(commitHash) {
        const commitData = JSON.parse(await this.getCommitData(commitHash));
        if(!commitData) {
            console.log("Commit not found");
            return;
        }
        console.log("Changes in the last commit are: ");

        for(const file of commitData.files) {
            console.log(`File: ${file.path}`);
            const fileContent = await this.getFileContent(file.hash);
            console.log(fileContent);

            if(commitData.parent) {
                // get the parent commit data
                const parentCommitData = JSON.parse(await this.getCommitData(commitData.parent));
                const getParentFileContent = await this.getParentFileContent(parentCommitData, file.path);
                if(getParentFileContent !== undefined) {
                    console.log('\nDiff:');
                    const diff = diffLines(getParentFileContent, fileContent);

                    // console.log(diff);

                    diff.forEach(part => {
                        if(part.added) {
                            process.stdout.write(chalk.green("++" + part.value));
                        } else if(part.removed) {    
                            process.stdout.write(chalk.red("--" + part.value));
                        } else {
                            process.stdout.write(chalk.grey(part.value));
                        }
                    });
                    console.log(); // new line
                } else {
                    console.log("New file in this commit");
                }

            } else {
                console.log("First commit");
            }

        }
    }

    async getParentFileContent(parentCommitData, filePath) {
        const parentFile = parentCommitData.files.find(file => file.path === filePath);
        if(parentFile) {
            // get the file content from the parent commit and return the content
            return await this.getFileContent(parentFile.hash);
        }
    }

    async getCommitData(commithash) {
        const commitPath = path.join(this.objectsPath, commithash);
        try {
            return await fs.readFile(commitPath, { encoding: 'utf-8'});
        } catch(error) {
            console.log("Failed to read the commit data", error);
            return null;
        }
    }

    async getFileContent(fileHash) {
        const objectPath = path.join(this.objectsPath, fileHash);
        return fs.readFile(objectPath, { encoding: 'utf-8' });
    }



}


// not from the commandline
// IIFE

(async ()=>{
    const versionvault = new VersionVault();
//    await versionvault.add('sample.txt');
//    await versionvault.add('sample2.txt');


//   await  versionvault.commit('2nd commit');

//   await versionvault.log();

    // await versionvault.showCommitDiff(`ff86e42ef340657eb6b613d08d9a4abeca863ff4`);
})();

