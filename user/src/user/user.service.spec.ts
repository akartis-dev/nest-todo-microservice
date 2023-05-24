import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { UserService } from './user.service';
import * as bcrypt from 'bcrypt';
import { createTestConfiguration } from 'src/database/data-source.test';
import { HttpException } from '@nestjs/common';

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

  it('should login user and return jwt token with user info', () => {
    const jwt = service.loginUser({
      email: 'test@dev.com',
      password: '12345678',
    });

    expect(jwt).toHaveProperty('token');
    expect(jwt).toHaveProperty('user');
    expect(jwt.user.email).toEqual('test@dev.com');
  });
});
