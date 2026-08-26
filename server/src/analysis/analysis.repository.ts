import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalysisRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.AiAnalysisLogUncheckedCreateInput) {
    return this.prisma.aiAnalysisLog.create({ data });
  }

  findMany(skip: number, take: number) {
    return this.prisma.aiAnalysisLog.findMany({
      orderBy: { id: 'desc' },
      skip,
      take,
    });
  }

  count() {
    return this.prisma.aiAnalysisLog.count();
  }
}
