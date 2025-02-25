import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { GetDTO } from '../../common/dto/params-dto';
import { Prisma } from '@prisma/client';
import * as ExcelJS from 'exceljs';

@Injectable()
export class DoctorService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(dto: GetDTO) {
    const { search, perPage, page, department, city, startDate, endDate } = dto;

    let filterQuery = Prisma.sql``;
    const searchQuery = search
      ? Prisma.sql`
            AND (
              d.nombre LIKE ${`%${search}%`} OR
              mun.nombre LIKE ${`%${search}%`}
            )
          `
      : Prisma.sql``;

    if (department) {
      filterQuery = Prisma.sql`${filterQuery} AND d.id_departamento = ${department}`;
    }

    if (city) {
      filterQuery = Prisma.sql`${filterQuery} AND d.id_municipio = ${city}`;
    }

    if (startDate && endDate) {
      const endDateTime = endDate + ' 23:59:59';
      filterQuery = Prisma.sql`${filterQuery} AND d.fecha BETWEEN ${startDate} AND ${endDateTime}`;
    }

    if (startDate && !endDate) {
      filterQuery = Prisma.sql`${filterQuery} AND d.fecha = ${startDate}`;
    }

    const query = Prisma.sql`
        SELECT
          d.id,
          COALESCE(dept.nombre, '-') AS departmentName,
          COALESCE(p.nombre, '-') AS countryName,
          COALESCE(mun.nombre, '-') AS city,
          d.nombre AS name,
          d.direccion_doctor AS address,
          d.fecha AS date,
          d.updated_at AS updatedAt
        FROM
          doctores AS d
        LEFT JOIN paises AS p ON d.id_pais = p.id
        LEFT JOIN departamentos AS dept ON d.id_departamento = dept.id
        LEFT JOIN municipio AS mun ON d.id_municipio = mun.id
        WHERE 1=1 ${searchQuery}  ${filterQuery}
        ORDER BY d.id DESC
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
        FROM doctores AS d
        LEFT JOIN paises AS p ON d.id_pais = p.id
        LEFT JOIN departamentos AS dept ON d.id_departamento = dept.id
        LEFT JOIN municipio AS mun ON d.id_municipio = mun.id
        WHERE 1=1 ${searchQuery} ${filterQuery}
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

  async getAllDoctors() {
    const query = Prisma.sql`
        SELECT
          d.nombre AS name,
          d.direccion_doctor AS address,
          dept.nombre AS departmentName,
          p.nombre AS countryName,
          mun.nombre AS city,
          d.fecha AS date
        FROM
        doctores AS d
        LEFT JOIN paises AS p ON d.id_pais = p.id
        LEFT JOIN departamentos AS dept ON d.id_departamento = dept.id
        LEFT JOIN municipio AS mun ON d.id_municipio = mun.id
    `;
    const data = await this.prisma.$queryRaw(query);
    return data;
  }

  async exportToExcel() {
    const data = (await this.getAllDoctors()) as any[];
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Lista');
    worksheet.columns = [
      { header: 'Nombre', key: 'name', width: 40 },
      { header: 'Direccion', key: 'address', width: 40 },
      { header: 'Departamento', key: 'departmentName', width: 40 },
      { header: 'Municipio', key: 'countryName', width: 40 },
      { header: 'Pais', key: 'city', width: 40 },
      { header: 'Fecha', key: 'date', width: 20 },
    ];

    data.forEach((v) => {
      worksheet.addRow({
        nombre: v.nombre,
        address: v.address,
        departmentName: v.departmentName,
        countryName: v.countryName,
        city: v.city,
        date: v.date,
      });
    });

    worksheet.getRow(1).font = { bold: true };
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}
