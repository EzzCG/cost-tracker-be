import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserController } from 'src/Controllers/user/user.controller';
import { MongooseUserRepository } from 'src/Repositories/user.mongoose-repository';
import { UserRepositoryToken } from 'src/Repositories/user.repository';
import { UserSchema } from 'src/Schemas/user.schema';
import { UserService } from 'src/Services/user/user.service';

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
