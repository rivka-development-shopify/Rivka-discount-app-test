// @ts-nocheck
import { json } from "@remix-run/node";

import { cors } from 'remix-utils/cors';

import {
  createTempDiscount,
  deleteTempDisocunt
} from '../controllers/tempDiscountController'


export const action = async ({ request }) => {
  try {
    const body = await request.json()

    let response;

    switch(request.method) {
      case 'POST':
        response = await createTempDiscount(body);
      break;
      case 'DELETE':
        response = await deleteTempDisocunt(body);
      break;
      default:
        return await cors(
          request,
          json({
              body: {
                data: {
                  err: 'Bad Request'
                }
              }
            },
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
              },
            }
          )
        );
    }

    if (!response) {
      throw 'Error on temp discount controller'
    }

    return await cors(
      request,
      json({
          body: {
            data: response
          }
        },
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
    );
  } catch (e) {
    console.error({ msg: "Error on temp discount action", err: e });
    return await cors(request, json(
      {
        body: {
          data: {
            err: 'Internal Server Error'
          }
        }
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    ));
  }
};


export const loader = async ({ request }) => {
  const response = json(
    {
      body: {
        data: {
          err: 'Bad Request'
        }
      }
    },
    {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return await cors(request, response);
}
