import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { GetDTO } from '../../common/dto/params-dto';
import { Prisma } from '@prisma/client';
import * as ExcelJS from 'exceljs';

@Injectable()
export class InstitutionService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(dto: GetDTO) {
    const { search, perPage, page } = dto;
    const searchQuery = search
      ? Prisma.sql`
              AND (
                nombre LIKE ${`%${search}%`}
              )
            `
      : Prisma.sql``;

    const query = Prisma.sql`
          SELECT
            id,
            nombre AS name,
            COALESCE(direccion, '-') AS address,
            fecha AS date,
            updated_at AS updatedAt
          FROM
          instituciones
          WHERE 1=1 ${searchQuery}
          ORDER BY nombre ASC
          LIMIT ${parseInt(perPage)} OFFSET ${(parseInt(page) - 1) * parseInt(perPage)};
        `;

    const serializedData = await this.prisma.$queryRaw(query);
    const data = JSON.parse(
      JSON.stringify(serializedData, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );

    const totalQuery = Prisma.sql`
            SELECT COUNT(*) AS total
            FROM instituciones
            WHERE 1=1 ${searchQuery}
          `;

    const totalResult = await this.prisma.$queryRaw(totalQuery);
    const total = Number(totalResult[0].total);
    const last_page = Math.ceil(total / parseInt(perPage));

    return {
      data,
      total,
      last_page,
    };
  }

  async getAllInstitutions(dto: GetDTO) {
    const { search } = dto;
    const searchQuery = search
      ? Prisma.sql`
        AND (
          nombre LIKE ${`%${search}%`}
        )`
      : Prisma.sql``;

    const query = Prisma.sql`
          SELECT
            nombre,
            direccion,
            fecha
          FROM
          instituciones
          WHERE 1=1 ${searchQuery}
          ORDER BY nombre ASC`;

    const data = await this.prisma.$queryRaw(query);
    return data;
  }

  async exportToExcel(dto: GetDTO) {
    const data = (await this.getAllInstitutions(dto)) as any[];

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Lista');
    worksheet.columns = [
      { header: 'Nombre', key: 'nombre', width: 40 },
      { header: 'Direccion', key: 'direccion', width: 40 },
      { header: 'Fecha de Creacion', key: 'fecha', width: 40 },
    ];

    data.forEach((v) => {
      worksheet.addRow({
        nombre: v.nombre,
        direccion: v.direccion,
        fecha: v.fecha,
      });
    });

    worksheet.getRow(1).font = { bold: true };
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}
