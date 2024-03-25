const encoder = new TextEncoder
const decoder = new TextDecoder

class Encoder {
   constructor(data) {
      if (arguments.length) this.raw = data;
   }
   async encode(data = this.raw) {
      if (!arguments.length && !this.raw) throw new Error('data is undefined');
      const type = data === null ? 'null' : typeof data;
      switch (type) {
         case 'undefined': return btoa(JSON.stringify([type, 'undefined']))
         case 'number': return this.encodeNumber(type, data)
         case 'null':
         case 'boolean':
         case 'string': return btoa(JSON.stringify([type, data]))
         case 'bigint': return btoa(JSON.stringify([type, data.toString()]));
         case 'symbol': return btoa(JSON.stringify([type, data.description]));
         case 'function': return btoa(JSON.stringify([type, data.toString()]));
         case 'object': return await this.encodeObjectVariant(data)
         default: return btoa(JSON.stringify([type, data]))
      }
   }
   encodeNumber(type, data) {
      let _data
      switch (data) {
         case data.isNaN: { _data = "NaN"; break }
         case -Infinity: { _data = "-Infinity"; break }
         case Infinity: { _data = "Infinity"; break }
         default: _data = data; break;
      }
      return btoa(JSON.stringify([type, _data]))
   }
   async encodeObjectVariant(data) {
      if (!arguments.length) throw new Error('data is undefined')
      const instance = (data)?.constructor ?? Object
      switch (instance) {
         case RegExp: return btoa(JSON.stringify([instance.name, { source: data.source, flags: data.flags }]))
         case Error: return btoa(JSON.stringify([instance.name, { message: data.message, cause: data.cause }]))
         case Blob: {
            const text = await data.text();
            return btoa(JSON.stringify([instance.name, text]))
         }
         case ArrayBuffer:
         case DataView: {
            const text = decoder.decode(data)
            return btoa(JSON.stringify([instance.name, text]))
         }
         case Int8Array:
         case Uint8Array:
         case Uint8ClampedArray:
         case Int16Array:
         case Uint16Array:
         case Int32Array:
         case Uint32Array:
         case Float32Array:
         case Float64Array: {
            //const text = decoder.decode(new Uint8Array([...data]));
            return btoa(JSON.stringify([instance.name, data.toString()]))
         }
         case BigInt64Array:
         case BigUint64Array: {
            //const text = decoder.decode(new Uint8Array([...data].map(e => e.toString())));
            return btoa(JSON.stringify([instance.name, data.toString()]))
         }
         case String:
         case Number:
         case Boolean:
         case Date: return btoa(JSON.stringify([instance.name, data.valueOf()]))
         case Array: return await this.encodeArray(data);
         case Object: return await this.encodeObject(data);
         case Map: return await this.encodeMap(data)
         case Set: return await this.encodeSet(data)
         default: return await this.encodeObject(data);
      }//end of Switch
   }
   async encodeArray(data) {
      const array = []
      for (const e of data) {
         array.push(await this.encode(e));
      }
      return btoa(JSON.stringify(["Array", array]))
   }
   async encodeObject(data) {
      const object = {}
      for (const e in data) {
         object[e] = await this.encode(data[e])
      }
      return btoa(JSON.stringify(["Object", object]))
   }
   async encodeMap(data) {
      const array = await this.encode([...data.entries()]);
      return btoa(JSON.stringify(["Map", array]))
   }
   async encodeSet(data) {
      const array = await this.encode([...data.values()]);
      return btoa(JSON.stringify(["Set", array]))
   }
}

class Decoder {
   constructor(data) {
      if (arguments.length) this.raw = data;
   }
   decode(data = this.raw) {
      if (!arguments.length && !this.raw) throw new Error('data is undefined');
      const [type, src] = JSON.parse(atob(data));
      switch (type) {
         case 'string': return src
         case 'null': return null
         case 'undefined': return undefined
         case 'boolean': return true === src
         case 'number': return +src
         case 'bigint': return BigInt(src)
         case 'symbol': return Symbol(src)
         case 'object': return src
         case 'function': return this.getFunction(src);
         case 'String': return new String(src);
         case 'Number': return new Number(src);
         case 'Boolean': return new Boolean(src);
         case 'Date': return new Date(+src);
         case 'RegExp': return new RegExp(src.source, src.flags);
         case 'Error': return new Error(src.message, { cause: src.cause })
         case 'Blob': return new Blob([src]);
         case 'DataView': return new DataView(encoder.encode(src).buffer);
         case 'ArrayBuffer': return encoder.encode(src).buffer;
         case 'Int8Array': return new Int8Array(src.split(','));
         case 'Uint8Array': return new Uint8Array(src.split(','));
         case 'Uint8ClampedArray': return new Uint8ClampedArray(src.split(','));
         case 'Int16Array': return new Int16Array(src.split(','));
         case 'Uint16Array': return new Uint16Array(src.split(','));
         case 'Int32Array': return new Int32Array(src.split(','));
         case 'Uint32Array': return new Uint32Array(src.split(','));
         case 'Float32Array': return new Float32Array(src.split(','));
         case 'Float64Array': return new Float64Array(src.split(','));
         case 'BigInt64Array': return new BigInt64Array(src.split(',').map(e => BigInt(e)));
         case 'BigUint64Array': return new BigUint64Array(src.split(',').map(e => BigInt(e)));
         case 'Array': return this.getArray(src);
         case 'Object': return this.getObject(src);
         case 'Map': return new Map(this.decode(src))
         case 'Set': return new Set(this.decode(src))
         default: return src;
      }
   }

   getArray(data) {
      const array = [];
      for (const e of data) {
         const r = this.decode(e);
         array.push(r)
      }
      return array;
   }
   getObject(data) {
      const object = {}
      for (const e in data) {
         const r = this.decode(data[e]);
         object[e] = r
      }
      return object;
   }
   getFunction(str) {
      const isFunction = str.match(/^\s*(async\s*)?function/)
      if (isFunction) return returnFunction(str);
      const isClass = str.match(/^\s*class/)
      if (isClass) return returnFunction(str);
      const isArrowFunction = str.match(/^\s*(.*)\s*=>/);
      if (isArrowFunction) return returnFunction(str);
      return Function('return ' + 'function ' + str)();

      function returnFunction(str) {
         return Function('return ' + str)()
      }
   }
}

function base64urlEncode(input) {
   return btoa(input)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
}

function base64urlDecode(input) {
   input = input.replace(/-/g, '+').replace(/_/g, '/');
   const padding = input.length % 4;
   if (padding) {
      input += '='.repeat(4 - padding);
   }
   return atob(input);
}

//https://developer.mozilla.org/en-US/docs/Glossary/Base64#the_unicode_problem
function base64ToBytes(base64) {
   const binString = atob(base64);
   const uin8arr = Uint8Array.from(binString, (m) => m.codePointAt(0));
   return new TextDecoder().decode(uin8arr)
}

function bytesToBase64(str) {
   const bytes = new TextEncoder().encode(str);
   const binString = String.fromCodePoint(...bytes);
   return btoa(binString);
}

const a = bytesToBase64("a Ā 𐀀 文 🦄")// 'YSDEgCDwkICAIOaWhyDwn6aE'
const b = base64ToBytes(a) // "a Ā 𐀀 文 🦄"

/**
 * 
 * @param {URL|string} path 
 * @param {any} data 
 * @returns 
 */
async function writencoded(path, data) {
   const encoded = await new Encoder().encode(data);
   try {
      Deno.writeTextFileSync(path, encoded);
   } catch (error) {
      return new Error(error)
   } finally {
      return true;
   }
}
/**
 * 
 * @param {URL|string} path 
 * @returns 
 */
async function readencoded(path) {
   const response = await fetch(path);
   if(!response) return new Error(`Error on fetching ${path}`)
   const text = await response.text();
   if (!text) return ''
   return new Decoder().decode(text);
}

export { Encoder, Decoder, base64urlEncode, base64urlDecode, base64ToBytes, bytesToBase64, writencoded, readencoded }