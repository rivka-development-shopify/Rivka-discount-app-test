// @ts-nocheck
import { json, redirect } from "@remix-run/node";

import { cors } from 'remix-utils/cors';

import {
  updateTempDiscount
} from '../controllers/tempDiscountController'

export const action = async ({ request }) => {
  const body = await request.json();
  switch(request.method) {
    case 'POST':
      const response = await updateTempDiscount(body)
      console.log('response apply')
      console.log(response)
      console.log('end response apply')
      return await cors(request, response);
    break;
    default:
      return await cors(request, json(
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
