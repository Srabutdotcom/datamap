const baseUrl = import.meta.url;
import { ensureFileSync } from "https://deno.land/std@0.220.1/fs/mod.ts";
import { writencoded, readencoded } from '../tools/codec.js';

export class DataMap {
   #dataMap = new Map
   #beingProcess = new Set;
   #dataMapBackup
   constructor(filePath='./filename.db') {
      this.filePath = filePath
      this.url = new URL(this.filePath, baseUrl); 
      ensureFileSync(this.url);
   }
   /**
    * Ensure all promise are done, and
    * update this.#dataMap value.
    */
   async clearAllBeingProcess(){
      
      if (this.#beingProcess.size) {
         // wait all Promise and clear this.#beingProcess
         await Promise.all([...this.#beingProcess])
         this.#beingProcess.clear();
         // update this.#dataMap
         this.#dataMap = await readencoded(this.url);
      }
   }

   async init() {
      const red = await readencoded(this.url);
      if(!red|red==''){
         await writencoded(this.url,this.#dataMap)
      } else {
         this.#dataMap = red;
      }
   }

   async set(key,value){
      // clear all promises
      await this.clearAllBeingProcess();
      // add data to this.#dataMap
      this.#dataMap.set(key, value);
      // update the file
      this.#beingProcess.add(writencoded(this.url,this.#dataMap));
      return true;
   }

   async get(key){
      // clear all promises
      await this.clearAllBeingProcess();
      return this.#dataMap.get(key)
   }

   async has(key){
      // clear all promises
      await this.clearAllBeingProcess();
      return this.#dataMap.has(key)
   }

   async delete(key){
      // clear all promises
      await this.clearAllBeingProcess();
      return this.#dataMap.delete(key)
   }

   async clear(){
      // clear all promises
      await this.clearAllBeingProcess();
      this.#dataMapBackup = new Map([...this.#dataMap])
      return this.#dataMap.clear()
   }

   async entries(){
      // clear all promises
      await this.clearAllBeingProcess();
      return this.#dataMap.entries()
   }

   async keys(){
      // clear all promises
      await this.clearAllBeingProcess();
      return this.#dataMap.keys()
   }

   async values(){
      // clear all promises
      await this.clearAllBeingProcess();
      return this.#dataMap.values()
   }
}

export async function DBMap(filename){
   const db = new DataMap(filename)
   await db.init();
   return db;
}
