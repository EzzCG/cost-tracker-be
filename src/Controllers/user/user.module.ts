import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserController } from 'src/Controllers/user/user.controller';
import { MongooseUserRepository } from './repos/user.mongoose-repository';
import { UserRepositoryToken } from './repos/user.repository';
import { UserSchema } from 'src/Controllers/user/schemas/user.schema';
import { UserService } from './services/user.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'User', schema: UserSchema }])],
  controllers: [UserController],
  providers: [
    UserService,
    { provide: UserRepositoryToken, useClass: MongooseUserRepository },
  ],
  exports: [UserService],
})
export class UserModule {}
