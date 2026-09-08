import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET ?? 'change-this-secret', signOptions: { expiresIn: '8h' } })],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
