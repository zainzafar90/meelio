import * as express from "express";

interface IUser {
  name: string;
  email: string;
  password: string;
  role: string;
  isEmailVerified: boolean;
  image?: string;
}

declare global {
  declare module "express" {
    interface Request {
      user?: IUser;
      cookies: {
        [key: string]: string;
      };
    }
  }
}
