import { getPublicAuthKeyByKey } from '../controllers/publicAuthKeysController'

export const validateAuthKeyParam = (requestUrl) => {
  const params =  new URLSearchParams(
    new URL(requestUrl).searchParams
  )
  return getPublicAuthKeyByKey(params.get('publicAuthKey'))
}

export default {
  validateAuthKeyParam
}
