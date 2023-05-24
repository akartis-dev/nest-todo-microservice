import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { UserCredential, UserLoggedData } from './types/userType';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private jwtService: JwtService,
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
  async loginUser(credential: UserCredential): Promise<UserLoggedData> {
    const user = await this.userRepository.findOneBy({
      email: credential.email,
    });

    if (!user) {
      throw new UnauthorizedException('', 'user not found');
    }

    const passwordValid = await bcrypt.compare(
      credential?.password,
      user.password,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('', 'wrong password');
    }

    const payload = { id: user.id, email: user.email };

    return {
      token: await this.jwtService.signAsync(payload),
      user,
    };
  }
}
