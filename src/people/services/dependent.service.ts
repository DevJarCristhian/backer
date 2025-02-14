import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { GetDTO } from '../../common/dto/params-dto';
import { Prisma } from '@prisma/client';
import * as ExcelJS from 'exceljs';

@Injectable()
export class DependentService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(dto: GetDTO) {
    const { search, perPage, page } = dto;

    const searchQuery = search
      ? Prisma.sql`
          AND (
            d.nombre LIKE ${`%${search}%`} OR 
            d.apellido LIKE ${`%${search}%`} OR 
            d.numero_documento LIKE ${`%${search}%`} OR
            dept.nombre LIKE ${`%${search}%`}
          )
        `
      : Prisma.sql``;

    const query = Prisma.sql`
      SELECT 
        d.id,
        dept.nombre AS departmentName,
        p.nombre AS countryName,
        CONCAT(d.nombre, ' ', d.apellido) AS fullName,
        d.sexo AS gender,
        d.direccion AS address,
        d.correo_electronico AS email,
        d.celular AS phone,
        COALESCE(d.fecha_nacimiento, '-') AS birthDate,
        d.numero_documento AS documentNumber,
        d.fecha_inscripcion AS enrollmentDate
      FROM 
        dependientes AS d
      LEFT JOIN paises AS p ON d.pais = p.id
      LEFT JOIN departamentos AS dept ON d.id_departamento = dept.id
      WHERE 1=1 ${searchQuery}
      ORDER BY d.id DESC
      LIMIT ${parseInt(perPage)} OFFSET ${(parseInt(page) - 1) * parseInt(perPage)};
    `;

    const data = await this.prisma.$queryRaw(query);

    const totalQuery = Prisma.sql`
      SELECT COUNT(*) AS total
      FROM dependientes AS d
      LEFT JOIN paises AS p ON d.pais = p.id
      LEFT JOIN departamentos AS dept ON d.id_departamento = dept.id
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

  async getAllDependents() {
    const query = Prisma.sql`
      SELECT
        dept.nombre AS departmentName,
        p.nombre AS countryName,
        CONCAT(d.nombre, ' ', d.apellido) AS fullName,
        d.sexo AS gender,
        d.direccion AS address,
        d.correo_electronico AS email,
        d.celular AS phone,
        COALESCE(d.fecha_nacimiento, '-') AS birthDate,
        d.numero_documento AS documentNumber,
        d.fecha_inscripcion AS enrollmentDate
      FROM
        dependientes AS d
      LEFT JOIN paises AS p ON d.pais = p.id
      LEFT JOIN departamentos AS dept ON d.id_departamento = dept.id
    `;
    const data = await this.prisma.$queryRaw(query);
    return data;
  }

  async exportToExcel() {
    const dependents = (await this.getAllDependents()) as any[];
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Dependientes');
    worksheet.columns = [
      { header: 'Nombre Completo', key: 'fullName', width: 40 },
      { header: 'Direccion', key: 'address', width: 40 },
      { header: 'Correo Electronico', key: 'email', width: 40 },
      { header: 'Sexo', key: 'gender', width: 15 },
      { header: 'Celular', key: 'phone', width: 20 },
      { header: 'Pais', key: 'countryName', width: 20 },
      { header: 'Departamento', key: 'departmentName', width: 20 },
      { header: 'Fecha de Nacimiento', key: 'birthDate', width: 20 },
      { header: 'Numero de Documento', key: 'documentNumber', width: 20 },
      { header: 'Fecha de Inscripcion', key: 'enrollmentDate', width: 20 },
    ];

    dependents.forEach((v) => {
      worksheet.addRow({
        fullName: v.fullName,
        address: v.address,
        email: v.email,
        gender: v.gender === 1 ? 'Hombre' : 'Mujer',
        phone: v.phone,
        countryName: v.countryName,
        departmentName: v.departmentName,
        birthDate: v.birthDate,
        documentNumber: v.documentNumber,
        enrollmentDate: v.enrollmentDate,
      });
    });

    worksheet.getRow(1).font = { bold: true };
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}
