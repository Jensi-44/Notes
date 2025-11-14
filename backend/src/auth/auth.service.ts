import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './interfaces/user.interface';

@Injectable()
export class AuthService {
  private dataPath = join(process.cwd(), 'data', 'users.json');
  private users: User[] = [];
  private jwtSecret = process.env.JWT_SECRET || 'JWT_SECRET'; 

  constructor() {
    this.loadFromFile().catch(() => this.saveToFile());
  }

  private async loadFromFile() {
    try {
      const raw = await fs.readFile(this.dataPath, 'utf-8');
      this.users = JSON.parse(raw);
    } catch {
      this.users = [];
      await this.saveToFile();
    }
  }

  private async saveToFile() {
    await fs.mkdir(join(process.cwd(), 'data'), { recursive: true });
    await fs.writeFile(
      this.dataPath,
      JSON.stringify(this.users, null, 2),
      'utf-8',
    );
  }

  async signup(dto: CreateUserDto) {
    await this.loadFromFile();
    if (this.users.find((u) => u.email === dto.email)) {
      throw new ConflictException('Email already registered');
    }
    const hashed = await bcrypt.hash(dto.password, 10);
    const user: User = {
      id: uuidv4(),
      email: dto.email,
      password: hashed,
      createdAt: new Date().toISOString(),
    };
    this.users.push(user);
    await this.saveToFile();
    return { id: user.id, email: user.email, createdAt: user.createdAt };
  }

  async login(dto: CreateUserDto) {
    await this.loadFromFile();
    const user = this.users.find((u) => u.email === dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    const token = jwt.sign(
      { sub: user.id, email: user.email },
      this.jwtSecret,
      { expiresIn: '7d' },
    );
    return { token, user: { id: user.id, email: user.email } };
  }

 
  verifyToken(token: string) {
    try {
      return jwt.verify(token, this.jwtSecret) as any;
    } catch {
      return null;
    }
  }
}
