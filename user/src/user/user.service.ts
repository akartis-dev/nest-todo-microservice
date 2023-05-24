import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const passwordCrypted = bcrypt.hashSync(createUserDto.password, 10);
    return await this.userRepository.save(
      this.userRepository.create({
        ...createUserDto,
        password: passwordCrypted,
      }),
    );
  }

  findAll() {
    return `This action returns all user`;
  }

  /**
   * Find one user
   *
   * @param id
   * @returns
   */
  async findOne(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new HttpException('user not found', HttpStatus.BAD_REQUEST);
    }

    return user;
  }

  /**
   * Update one user
   *
   * @param id
   * @param updateUserDto
   */
  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new HttpException('user not found', HttpStatus.BAD_REQUEST);
    }

    return await this.userRepository.save(
      this.userRepository.create({ ...user, ...updateUserDto }),
    );
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  /**
   * Login user and return jwt
   * @param arg0
   */
  loginUser(arg0: { email: string; password: string }) {
    throw new Error('Method not implemented.');
  }
}
