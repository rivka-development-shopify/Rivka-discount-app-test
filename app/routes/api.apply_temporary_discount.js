// @ts-nocheck
import { json, redirect } from "@remix-run/node";

import { cors } from 'remix-utils/cors';

import {
  createTempDiscount
} from '../controllers/tempDiscountController'

export const action = async ({ request }) => {
  const body = await request.json();
  switch(request.method) {
    case 'POST':
      return await cors(request, await createTempDiscount(body));
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
