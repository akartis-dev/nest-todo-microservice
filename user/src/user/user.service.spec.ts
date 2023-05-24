import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { UserService } from './user.service';
import * as bcrypt from 'bcrypt';
import { createTestConfiguration } from 'src/database/data-source.test';
import { HttpException, UnauthorizedException } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

const newUser: CreateUserDto = {
  email: 'test@dev.com',
  name: 'Sitraka',
  password: '12345678',
};

describe('UserService', () => {
  let service: UserService;
  // let context: TransactionalTestContext;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(createTestConfiguration([User])),
        TypeOrmModule.forFeature([User]),
        JwtModule.register({
          global: true,
          secret: '12345678',
          signOptions: { expiresIn: '60s' },
        }),
      ],
      providers: [UserService],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));

    // add minimum one user
    await service.create(newUser);
  });

  it('should create new user', async () => {
    const user = await service.create(newUser);

    expect(user.id).not.toBeNull();
    expect(user.email).toEqual('test@dev.com');
  });

  it('should test if password is encrypted and valid', async () => {
    const user = await service.create(newUser);
    expect(user.password).toMatch(/^\$2b\$/gm);

    const isValid = bcrypt.compareSync(newUser.password, user.password);
    expect(isValid).toBeTruthy();
  });

  it('should return the user with id', async () => {
    const user = await service.findOne(1);

    expect(user.id).not.toBeNull();
    expect(user.id).toEqual(1);
  });

  it('should return the exception where user not found', async () => {
    expect(service.findOne(1000)).rejects.toThrow(HttpException);
  });

  it('should update user info', async () => {
    const user = await service.update(1, {
      email: 'edited@dev.com',
      name: 'Edited',
    });

    expect(user.email).toBe('edited@dev.com');
    expect(user.name).toBe('Edited');
  });

  it('should return exception if update null user', () => {
    expect(
      service.update(1000, { email: 'email@dev.com', name: 'Edited' }),
    ).rejects.toThrow(HttpException);
  });

  it('should login user and return jwt token with user info', async () => {
    const jwt = await service.loginUser({
      email: 'test@dev.com',
      password: '12345678',
    });

    expect(jwt).toHaveProperty('token');
    expect(jwt).toHaveProperty('user');
    expect(jwt.user.email).toEqual('test@dev.com');
  });

  it('should return unauthorized exception when user is not found', async () => {
    expect(
      service.loginUser({ email: 'not-found@dev.com', password: '12345678' }),
    ).rejects.toThrow(UnauthorizedException);
    expect(
      service.loginUser({ email: 'not-found@dev.com', password: '12345678' }),
    ).rejects.toThrow('user not found');
  });

  it('should return unauthorized excetion when user is found but password is wrong', async () => {
    expect(
      service.loginUser({ email: 'test@dev.com', password: 'wrong_password' }),
    ).rejects.toThrow(UnauthorizedException);
    expect(
      service.loginUser({ email: 'test@dev.com', password: 'wrong_password' }),
    ).rejects.toThrow('wrong password');
  });

  // it('should verify if login user data not content password', async () => {
  //   const jwt = await service.loginUser({
  //     email: 'test@dev.com',
  //     password: '12345678',
  //   });

  //   console.log('jwt', jwt);

  //   expect(jwt.user).not.toHaveProperty('password');
  // });
});
