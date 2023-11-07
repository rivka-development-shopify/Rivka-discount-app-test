import { createReadableStreamFromReadable } from '@remix-run/node';
import * as fs from 'fs';
import UglifyJS from 'uglify-js';
import { json } from "@remix-run/node";
import path from 'path';

import JavaScriptObfuscator from 'javascript-obfuscator';

const validateAuthKeyParam = (requestUrl) => {

  //get it from the db?
  const aceptedKeys = [
    'test-public-key'
  ]


  const params =  new URLSearchParams(
    new URL(requestUrl).searchParams
  )
  return params.has('publicAuthKey') && aceptedKeys.includes(params.get('publicAuthKey'))
}

// WILL THIS WORK IN PRODUCTION?
const getBundleMinFile = async () => {
  const cwd = process.cwd();
  const bundlePath = new URL(`${cwd}/app/assets/bundle.js`).pathname;
  const rawBundle = await fs.promises.readFile(bundlePath, 'utf-8');
  const bundle = rawBundle.replace('SHOPIFYAPPAPIPUBLICKEY', 'public-key')
  const { code } = UglifyJS.minify(bundle)
  const bundleMin = JavaScriptObfuscator.obfuscate(
    code, {
        compact: false,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 1,
        numbersToExpressions: true,
        simplify: true,
        stringArrayShuffle: true,
        splitStrings: true,
        stringArrayThreshold: 1
    }
  );
  return bundleMin.getObfuscatedCode()
}

export async function loader({ request }) {
  try {

    if(!validateAuthKeyParam(request.url)) {
      throw {
        type: 'IncorrectAuthKey'
      }
    }

    return new Response(await getBundleMinFile(), {
      headers: {
        'Content-Type': 'application/javascript',
      },
    });
  } catch(e) {
    if(e.type) {
      switch(e.type){
        case 'IncorrectAuthKey':
          console.error(e)
          return json(
            {
              err: 'Bad Request'
            },
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
              },
            }
          )
          break;
      }
    } else {
      console.error({
        msg: 'Error on bundle endpoint',
        err: e
      })
      return json(
        {
          err: 'Internal Server Error'
        },
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
    }
  }
}
