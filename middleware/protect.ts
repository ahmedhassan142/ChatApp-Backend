import jwt from "jsonwebtoken";


interface JWTUserData {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export async function protect(req: { cookies: { authToken?: string } }): Promise<JWTUserData> {
  return new Promise((resolve, reject) => {
    const token = req.cookies?.authToken;
    if (token) {
      jwt.verify(
        token,
        process.env.JWTPRIVATEKEY as string,
        {},
        (err, userData) => {
          if (err) {
            reject(err);
          } else {
            resolve(userData as JWTUserData);
          }
        }
      );
    } else {
      reject("no token");
    }
  });
}