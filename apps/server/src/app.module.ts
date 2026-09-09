import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// 模块边界按"数据服务 / 计算服务"组织（plan.md 6.3 架构护栏），后续按此拆分
@Module({
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
