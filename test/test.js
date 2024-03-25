import { DBMap, DataMap } from '../src/index.js';
import { existsSync, ensureFileSync } from "https://deno.land/std@0.220.1/fs/mod.ts";

//const isFileExist = existsSync('./dir/test.db');
//const isFileExist = ensureFileSync('./dir/test.db');
//debugger;

const dbMap = await DBMap('./dir/test.db');

const user1 = {name: "John", age:'25', id:123456}

await dbMap.set(user1.name, user1);

const found = await dbMap.get('John');
const has = await dbMap.has('John')
const entries = [...await dbMap.entries()]
const keys = [...await dbMap.keys()]
const values = [...await dbMap.values()]
dbMap.clear();

debugger;
