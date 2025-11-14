import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { NotesModule } from './notes/notes.module';
import { JwtMiddleware } from './common/jwt.middleware';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,      // <-- IMPORTANT
    }),
    NotesModule,
    AuthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).forRoutes('*');
  }
}
