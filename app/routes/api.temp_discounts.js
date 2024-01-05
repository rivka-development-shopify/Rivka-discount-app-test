import * as fs from 'fs';
import { json } from "@remix-run/node";
import { validateAuthKeyParam } from '../utils/publicAuthKey'
import { getAllTempDiscounts } from '../controllers/tempDiscountController'
import { cors } from 'remix-utils/cors';

export async function loader({ request }) {

  try {
    if(!validateAuthKeyParam(request.url)) {
        throw {
          type: 'IncorrectAuthKey'
        }
      }

    return await cors(request, await getAllTempDiscounts());
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
