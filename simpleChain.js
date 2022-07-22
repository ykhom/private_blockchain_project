const SHA256 = require('crypto-js/sha256');
const { Level } = require('level');
const { EntryStream } = require('level-read-stream')
const chainDB = './chaindata';
const db = new Level(chainDB);

// Class wuth constructor for new block
class Block{
    constructor(data){
        this.hash = "",
        this.height = 0,
        this.time = 0,
        this.previousBlockHash = "",
        this.body = data
    }
}

// Class with a constructor for new blockchain
class Blockchain{
    constructor(){
        this.getBlockHeight().then((height) => {
            if (height === -1) {
              this.addBlock(new Block("Genesis block")).then(() => console.log("Genesis block added!"))
            }
        })
    }
    async addBlock(newBlock){
        const height = parseInt(await this.getBlockHeight())

        newBlock.height = height + 1
        newBlock.time = new Date().getTime().toString().slice(0, -3)

        if (newBlock.height > 0) {
            const prevBlock = await this.getBlock(height)
            newBlock.previousBlockHash = prevBlock.hash
            console.log(`Previous hash: ${newBlock.previousBlockHash}`)
        }
      
        newBlock.hash = SHA256(JSON.stringify(newBlock)).toString()
        console.log(`New hash: ${newBlock.hash}`)

        await this.addBlockToDB(newBlock.height, JSON.stringify(newBlock));
    }
    
    /*
    * Criteria: Modify getBlockHeight() function to retrieve current block height within the LevelDB chain.
    */
    
    async getBlockHeight() {
        return await this.getBlockHeightFromDB()
    }

    // get block
    async getBlock(blockHeight){
        // return object as a single string
        return JSON.parse(await this.getBlockFromDB(blockHeight))
    }
  

    /**
    * Criteria: Modify getBlockHeight() function to retrieve current block height within the LevelDB chain.
    */
    async getBlockHeight() {
        return await this.getBlockHeightFromDB()
    }

    /**
    * Criteria: Modify the validateBlock() function to validate a block stored within levelDB.
    * 
    * @param {int} blockHeight 
    */
    async validateBlock(blockHeight) {
        let block = await this.getBlock(blockHeight);
        let blockHash = block.hash;
        block.hash = '';
    
        let validBlockHash = SHA256(JSON.stringify(block)).toString();

        if (blockHash === validBlockHash) {
            return true;
         } else {
            сonsole.log(`Block #${blockHeight} invalid hash: ${blockHash} <> ${validBlockHash}`);
            return false;
        }
    }

    /**
    * Criteria: Modify the validateChain() function to validate blockchain stored within levelDB.
    */
    async validateChain() {
        let errorLog = []
        let previousHash = ''
        let isValidBlock = false

        const heigh = await this.getBlockHeightFromDB()

        for (let i = 0; i < heigh; i++) {
        this.getBlock(i).then((block) => {
            isValidBlock = this.validateBlock(block.height)

            if (!isValidBlock) {
                errorLog.push(i)
            } 

            if (block.previousBlockHash !== previousHash) {
                errorLog.push(i)
            }

            previousHash = block.hash

            if (i === (heigh -1)) {
                if (errorLog.length > 0) {
                    console.log(`Block errors = ${errorLog.length}`)
                    console.log(`Blocks: ${errorLog}`)
                } else {
                    console.log('No errors detected')
                }
            }
        })
        }
    }

    // Level db functions
    addBlockToDB(key, value) {
        return new Promise((resolve, reject) => {
            db.put(key, value, (error) => {
                if (error) {
                reject(error)
                }
        
                console.log(`Added block #${key}`)
                resolve(`Added block #${key}`)
            })
        })
    }

    getBlockFromDB(key) {
        return new Promise((resolve, reject) => {
            db.get(key, (error, value) => {
                if (error) {
                reject(error)
                }
        
                resolve(value)
            })
        })
    }

    getBlockHeightFromDB() {
        return new Promise((resolve, reject) => {
            let height = -1
            const stream = new EntryStream(db)
            stream.on('data', (data) => {
                height++
            }).on('error', (error) => {
                reject(error)
            }).on('close', () => {
                resolve(height)
            })
        })
    }
}

let blockchain = new Blockchain();

(function theLoop (i) {
    setTimeout(() => {
        blockchain.addBlock(new Block(`Test data ${i}`)).then(() => {
            if (--i) {
                theLoop(i)
            }
        })
    }, 100);
})(10);
  
setTimeout(() => blockchain.validateChain(), 2000)