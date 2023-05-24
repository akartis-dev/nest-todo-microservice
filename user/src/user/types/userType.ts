import { User } from '../entities/user.entity';

export type UserCredential = {
  email: string;
  password: string;
};

export type UserLoggedData = {
  token: string;
  user: User;
};
