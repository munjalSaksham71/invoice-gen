export const validateUser = (token: string): boolean => {
  try {
    // const decoded = jwt.decode(token) as AuthTokenPayload;
    return token ? true : false;
  } catch (error) {
    return false;
  }
};