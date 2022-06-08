import { NextFunction, Request, Response } from "express";
import jsonwebtoken from "jsonwebtoken";

import { ensureAuthenticated } from "./ensureAuthenticated";
import { JWTTokenMissingError } from "../../../errors/JWTTokenMissingError";
import { JWTInvalidTokenError } from "../../../errors/JWTInvalidTokenError";

let nextMock: jest.Mock;
let verifyMocked: jest.SpyInstance;

const fakeUserId = "fake-user-id";

let request = {
  headers: {
    authorization: `bearer fake-token`
  }
} as Request;
let response = {} as Response;

describe("Ensure Authenticated middleware", () => {
  beforeEach(async () => {
    nextMock = jest.fn();
  });

  it("should me able to pass the middleware's validations and call the next function", async () => {
    verifyMocked = jest.spyOn(jsonwebtoken, "verify")
      .mockImplementation(() => ({ sub: fakeUserId }));

    ensureAuthenticated(
      request, response, nextMock as unknown as NextFunction
    );

    expect(verifyMocked).toHaveBeenCalled();
    
    expect(request).toHaveProperty("user");
    expect(request.user).toHaveProperty("id");
    expect(request.user.id).toBe(fakeUserId);

    expect(nextMock).toHaveBeenCalled();
  });

  it("should not be able to call the next function if JWT token is missing", async () => {
    const requestWithoutAuthorization = {
      headers: {}
    } as Request;

    await expect(
      ensureAuthenticated(
        requestWithoutAuthorization,
        response,
        nextMock as unknown as NextFunction
      )
    ).rejects.toEqual(new JWTTokenMissingError());

    expect(nextMock).not.toHaveBeenCalled();
  });

  it("should not be able to call the next function if JWT token is invalid", async () => {
    verifyMocked = jest.spyOn(jsonwebtoken, "verify")
      .mockImplementation(() => {throw new Error()});

    await expect(
      ensureAuthenticated(
        request,
        response,
        nextMock as unknown as NextFunction
      )
    ).rejects.toEqual(new JWTInvalidTokenError());

    expect(nextMock).not.toHaveBeenCalled();
  })
});
