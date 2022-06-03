import axios from "axios";
import { stringify } from "query-string";

export const verifyCaptcha = async (response, ip: string): Promise<any> => {
  if (!process.env.RECAPTCHA_SECRET) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    axios
      .post<any>(
        "https://www.google.com/recaptcha/api/siteverify",
        stringify({
          secret: process.env.RECAPTCHA_SECRET,
          response,
          remoteip: ip,
        }),
        {
          headers: {
            "content-type": "application/x-www-form-urlencoded",
          },
        }
      )
      .then((response) => {
        resolve(response.data.success);
      })
      .catch((e) => {
        reject(e);
      });
  });
};
