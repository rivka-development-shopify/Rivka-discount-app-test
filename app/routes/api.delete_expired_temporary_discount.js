// @ts-nocheck
import { json, redirect } from "@remix-run/node";

import { cors } from 'remix-utils/cors';

import {
  deleteExpiredDiscounts
} from '../controllers/tempDiscountController'

export const action = async ({ request }) => {

  switch(request.method) {
    case 'DELETE':
      return await cors(request, await deleteExpiredDiscounts(request));
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
