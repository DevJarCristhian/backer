import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { GetDTO } from '../../common/dto/params-dto';
import { Prisma } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import { UpdatePatientDto } from '../dto/patient/update-patient.dto';
const dayjs = require('dayjs');

@Injectable()
export class PatientService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(dto: GetDTO) {
    const {
      search,
      perPage,
      page,
      country,
      gender,
      department,
      birthDate,
      startDate,
      endDate,
    } = dto;

    let filterQuery = Prisma.sql``;
    const searchQuery = search
      ? Prisma.sql`
            AND (
              p.nombre LIKE ${`%${search}%`} OR
              p.apellido LIKE ${`%${search}%`} OR
              p.numero_documento LIKE ${`%${search}%`} OR
              p.celular LIKE ${`%${search}%`}
            )
          `
      : Prisma.sql``;

    if (country && country != 0) {
      filterQuery = Prisma.sql`${filterQuery} AND p.id_pais = ${country}`;
    }

    if (gender) {
      filterQuery = Prisma.sql`${filterQuery} AND p.sexo = ${gender}`;
    }

    if (department) {
      filterQuery = Prisma.sql`${filterQuery} AND p.id_departamento = ${department}`;
    }

    if (birthDate) {
      filterQuery = Prisma.sql`${filterQuery} AND p.fecha_nacimiento = ${birthDate}`;
    }

    if (startDate && endDate) {
      const endDateTime = endDate + ' 23:59:59';
      filterQuery = Prisma.sql`${filterQuery} AND p.fecha_inscripcion BETWEEN ${startDate} AND ${endDateTime}`;
    }

    if (startDate && !endDate) {
      filterQuery = Prisma.sql`${filterQuery} AND p.fecha_inscripcion = ${startDate}`;
    }

    const query = Prisma.sql`
        SELECT
          p.id,
          dept.nombre AS departmentName,
          pa.nombre AS countryName,
          CONCAT(p.nombre, ' ', p.apellido) AS fullName,
          p.direccion AS address,
          p.correo AS email,
          p.sexo AS gender,
          p.celular AS phone,
          p.tipo_documento AS documentType,
          p.numero_documento AS documentNumber,
          p.fecha_nacimiento AS birthDate,
          p.fecha_inscripcion AS enrollmentDate
        FROM
          pacientes AS p
        LEFT JOIN paises AS pa ON p.id_pais = pa.id
        LEFT JOIN departamentos AS dept ON p.id_departamento = dept.id
        WHERE 1=1 ${searchQuery} ${filterQuery}
        ORDER BY p.id DESC
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
        FROM pacientes AS p
        LEFT JOIN paises AS pa ON p.id_pais = pa.id
        LEFT JOIN departamentos AS dept ON p.id_departamento = dept.id
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

  async getPatientById(id: number) {
    const query = Prisma.sql`
        SELECT
          p.id,
          -- p.informacion_paciente AS patientInformation,
          p.consumo_medicamentos AS medicationConsumption,
          -- p.id_operador AS operatorId,
          -- p.envio_correo AS emailSending,
          -- p.envio_whatsapp AS whatsappSending,
          -- p.envio_correo_fisico AS physicalMailSending,
          p.sexo AS gender,
          p.fecha_inicio_programa AS programStartDate,
          p.verificado AS verified,
          p.cantidad_canjes AS quantityRedemptions,
          d.nombre AS doctorName,
          i.nombre AS institutionName,

          p.estado_civil AS civilStatus,
          p.estado_paciente AS patientStatus,
          p.tipo_paciente AS patientType,
          p.nombre_contacto AS contactName,
          p.descripcion AS description,
          p.fecha_actualiza AS dateUpdated
          -- p.fecha_creacion AS createdAt,
          -- p.usuario_crea AS createdBy,
          -- p.usuario_modifica AS updatedBy,
          -- p.eliminado AS deleted,
        FROM
          pacientes AS p
        LEFT JOIN doctores AS d ON p.id_medico = d.id
        LEFT JOIN instituciones AS i ON p.id_institucion = i.id
        WHERE p.id = ${id};
      `;

    const serializedData = await this.prisma.$queryRaw(query);
    const newData = JSON.parse(
      JSON.stringify(serializedData, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );

    const data = newData.map((v: any) => ({
      ...v,
      verified: v.verified.toString(),
      quantityRedemptions: v.quantityRedemptions.toString(),
      medicationConsumption: v.medicationConsumption.toString(),
      civilStatus: parseInt(v.civilStatus),
      patientStatus: parseInt(v.patientStatus),
      patientType: parseInt(v.patientType),
    }));

    return {
      data: data[0],
    };
  }

  async getAllPatients(dto: GetDTO) {
    const { search, country, gender, department, birthDate, startDate, endDate } = dto;

    let filterQuery = Prisma.sql``;
    const searchQuery = search
      ? Prisma.sql`
            AND (
              p.nombre LIKE ${`%${search}%`} OR
              p.apellido LIKE ${`%${search}%`} OR
              p.numero_documento LIKE ${`%${search}%`} OR
              p.celular LIKE ${`%${search}%`}
            )
          `
      : Prisma.sql``;

    if (country && country != 0) {
      filterQuery = Prisma.sql`${filterQuery} AND p.id_pais = ${country}`;
    }

    if (gender) {
      filterQuery = Prisma.sql`${filterQuery} AND p.sexo = ${gender}`;
    }

    if (department) {
      filterQuery = Prisma.sql`${filterQuery} AND p.id_departamento = ${department}`;
    }

    if (birthDate) {
      filterQuery = Prisma.sql`${filterQuery} AND p.fecha_nacimiento = ${birthDate}`;
    }

    if (startDate && endDate) {
      const endDateTime = endDate + ' 23:59:59';
      filterQuery = Prisma.sql`${filterQuery} AND p.fecha_inscripcion BETWEEN ${startDate} AND ${endDateTime}`;
    }

    if (startDate && !endDate) {
      filterQuery = Prisma.sql`${filterQuery} AND p.fecha_inscripcion = ${startDate}`;
    }

    const query = Prisma.sql`
      SELECT
        CONCAT(p.nombre, ' ', p.apellido) AS nombre_completo,
        p.direccion,
        p.correo,
        p.sexo,
        p.celular,
        pa.nombre AS pais,
        dept.nombre AS departamento,
        p.tipo_documento,
        p.numero_documento,
        p.fecha_nacimiento,
        p.fecha_inscripcion,
        p.consumo_medicamentos,
        p.envio_correo,
        p.envio_whatsapp,
        p.envio_correo_fisico,
        p.fecha_inicio_programa,
        p.verificado,
        p.cantidad_canjes,

        d.nombre AS nombre_doctor,
        i.nombre AS nombre_institucion,

        p.estado_civil,
        p.estado_paciente,
        p.genero,
        p.nombre_contacto,
        p.descripcion
      FROM
        pacientes AS p
      LEFT JOIN paises AS pa ON p.id_pais = pa.id
      LEFT JOIN departamentos AS dept ON p.id_departamento = dept.id
      LEFT JOIN doctores AS d ON p.id_medico = d.id
      LEFT JOIN instituciones AS i ON p.id_institucion = dept.id
      WHERE 1=1 ${searchQuery} ${filterQuery}
    `;

    const serializedData = await this.prisma.$queryRaw(query);
    const data = JSON.parse(
      JSON.stringify(serializedData, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );

    return data;
  }

  async exportToExcel(dto: GetDTO) {
    const patients = (await this.getAllPatients(dto)) as any[];

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Dependientes');
    worksheet.columns = [
      { header: 'Nombre', key: 'nombre_completo', width: 40 },
      { header: 'Direccion', key: 'direccion', width: 40 },
      { header: 'Correo', key: 'correo', width: 40 },
      { header: 'Sexo', key: 'sexo', width: 40 },
      { header: 'celular', key: 'celular', width: 20 },
      { header: 'pais', key: 'pais', width: 20 },
      { header: 'departamento', key: 'departamento', width: 20 },
      { header: 'Tipo Documento', key: 'tipo_documento', width: 20 },
      { header: 'Numero de Documento', key: 'numero_documento', width: 20 },
      { header: 'Fecha de Nacimiento', key: 'fecha_nacimiento', width: 20 },
      { header: 'Fecha de Inscripcion', key: 'fecha_inscripcion', width: 20 },

      {
        header: 'Informacion del paciente',
        key: 'informacion_paciente',
        width: 20,
      },
      {
        header: 'Consumo de medicamentos',
        key: 'consumo_medicamentos',
        width: 20,
      },
      { header: 'Envio de correo', key: 'envio_correo', width: 20 },
      { header: 'Envio de whatsapp', key: 'envio_whatsapp', width: 20 },
      {
        header: 'Envio de correo fisico',
        key: 'envio_correo_fisico',
        width: 20,
      },
      {
        header: 'Fecha de inicio del programa',
        key: 'fecha_inicio_programa',
        width: 20,
      },
      { header: 'Verificado', key: 'verificado', width: 20 },
      { header: 'Cantidad de canjes', key: 'cantidad_canjes', width: 20 },
      { header: 'Nombre del doctor', key: 'nombre_doctor', width: 20 },
      {
        header: 'Nombre de la institucion',
        key: 'nombre_institucion',
        width: 20,
      },
      { header: 'Estado civil', key: 'estado_civil', width: 20 },
      { header: 'Estado del paciente', key: 'estado_paciente', width: 20 },
      { header: 'Genero', key: 'genero', width: 20 },
      { header: 'Nombre del contacto', key: 'nombre_contacto', width: 20 },
      { header: 'Descripcion', key: 'descripcion', width: 20 },
    ];

    patients.forEach((v) => {
      worksheet.addRow({
        nombre_completo: v.nombre_completo,
        direccion: v.direccion,
        correo: v.correo,
        sexo: v.sexo == 1 ? 'Hombre' : 'Mujer',

        celular: v.celular,
        pais: v.pais,
        departamento: v.departamento,
        tipo_documento: v.tipo_documento,
        numero_documento: v.numero_documento,
        fecha_nacimiento: v.fecha_nacimiento,
        fecha_inscripcion: v.fecha_inscripcion,

        informacion_paciente: v.informacion_paciente,
        consumo_medicamentos: v.consumo_medicamentos,
        envio_correo: v.envio_correo,
        envio_whatsapp: v.envio_whatsapp,
        envio_correo_fisico: v.envio_correo_fisico,
        fecha_inicio_programa: v.fecha_inicio_programa,
        verificado: v.verificado,
        cantidad_canjes: v.cantidad_canjes,
        nombre_doctor: v.nombre_doctor,
        nombre_institucion: v.nombre_institucion,
        estado_civil: v.estado_civil,
        estado_paciente: v.estado_paciente,
        genero: v.genero,
        nombre_contacto: v.nombre_contacto,
        descripcion: v.descripcion,
      });
    });

    worksheet.getRow(1).font = { bold: true };
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  async findPatient(dto: GetDTO) {
    const { search } = dto;
    const searchQuery = search
      ? Prisma.sql`
        AND (
          nombre LIKE ${`%${search}%`} OR 
          apellido LIKE ${`%${search}%`} OR 
          numero_documento LIKE ${`%${search}%`}
        )
      `
      : Prisma.sql``;

    const query = Prisma.sql`
    SELECT DISTINCT
      id,
      nombre,
      numero_documento AS documentNumber,
      CONCAT(nombre, ' ', apellido) AS label,
      sexo AS gender,
      celular AS value
    FROM 
      pacientes
    WHERE 1=1 ${searchQuery}
    ORDER BY nombre ASC
    LIMIT 10;
  `;

    const data = (await this.prisma.$queryRaw(query)) as any[];

    const result = data.map((row) => ({
      ...row,
      id: row.id.toString(),
    }));

    return result;
  }

  async findPatientSelect(dto: GetDTO) {
    const { search, country, gender, birthDate, incriptionDate, startDate, endDate } = dto;

    let filterQuery = Prisma.sql``;
    const searchQuery = search
      ? Prisma.sql`
        AND (
          nombre LIKE ${`%${search}%`} OR 
          apellido LIKE ${`%${search}%`} OR 
          numero_documento LIKE ${`%${search}%`} OR
          celular LIKE ${`%${search}%`}
        )
      `
      : Prisma.sql``;

    if (country && country != 0) {
      filterQuery = Prisma.sql`${filterQuery} AND id_pais = ${country}`;
    }

    if (gender) {
      filterQuery = Prisma.sql`${filterQuery} AND sexo = ${gender}`;
    }

    if (birthDate) {
      filterQuery = Prisma.sql`${filterQuery} AND DATE_FORMAT(fecha_nacimiento, '%m-%d') = ${birthDate}`;
    }

    if (incriptionDate) {
      filterQuery = Prisma.sql`${filterQuery} AND fecha_inscripcion = ${incriptionDate}`;
    }

    if (startDate && endDate) {
      const endDateTime = endDate + ' 23:59:59';
      filterQuery = Prisma.sql`${filterQuery} AND fecha_inscripcion BETWEEN ${startDate} AND ${endDateTime}`;
    }

    const query = Prisma.sql`
    SELECT DISTINCT
      id,
      numero_documento AS documentNumber,
      CONCAT(nombre, ' ', apellido) AS name,
      sexo AS gender,
      celular AS phone,
      fecha_nacimiento as birthDate,
      fecha_inscripcion AS enrollmentDate
    FROM 
      pacientes
    WHERE 1=1 ${searchQuery} ${filterQuery}
    ORDER BY  fecha_inscripcion DESC
    LIMIT 50;
  `;

    const data = (await this.prisma.$queryRaw(query)) as any[];

    const result = data.map((row) => {
      const age = dayjs().diff(dayjs(row.birthDate), 'year').toString();
      return {
        ...row,
        id: row.id.toString(),
        age,
        gender: row.gender === 1 ? 'Hombre' : 'Mujer',
        birthDate: dayjs.utc(row.birthDate).format('YYYY-MM-DD'),
        selected: false,
      };
    });

    return result;
  }

  async updatePatient(user: number, id: number, dto: UpdatePatientDto) {
    const query = Prisma.sql`
      UPDATE pacientes
      SET
      sexo = ${dto.gender},
      estado_civil = ${dto.civilStatus},
      estado_paciente = ${dto.patientStatus},
      tipo_paciente = ${dto.patientType},
      nombre_contacto = ${dto.contactName},
      descripcion = ${dto.description},
      fecha_actualiza =  ${new Date()},
      celular = ${dto.phone},
      usuario_modifica = ${user}
      WHERE id = ${id};
    `;

    await this.prisma.$queryRaw(query);

    return 'Paciente actualizado correctamente';
  }

  async getMaintenance() {
    const query = Prisma.sql`
      SELECT
        mcab.id,
        mcab.descripcion,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT("label", mdet.descripcion, "value", mdet.id)
          )
          FROM mantenimiento_hijos AS mdet 
          WHERE mdet.id_cab = mcab.id
        ) AS detalles
      FROM mantenimiento_padres AS mcab
      GROUP BY mcab.id, mcab.descripcion
    `;

    const serializedData = await this.prisma.$queryRaw(query);
    const data = JSON.parse(
      JSON.stringify(serializedData, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );

    return data;
  }

  async findDepartment(dto: GetDTO) {
    const { search } = dto;

    const searchQuery = search
      ? Prisma.sql`
        AND (
          nombre LIKE ${`%${search}%`}
        )
      `
      : Prisma.sql``;

    const query = Prisma.sql`
      SELECT 
        id AS value, 
        nombre AS label 
      FROM departamentos
      WHERE 1=1 ${searchQuery}
      ORDER BY nombre ASC
      LIMIT 10;`;

    const data = (await this.prisma.$queryRaw(query)) as any[];

    const result = data.map((row) => ({
      ...row,
      value: row.value.toString(),
    }));

    return result;
  }

  async findCity(dto: GetDTO) {
    const { search } = dto;

    const searchQuery = search
      ? Prisma.sql`
        AND (
          nombre LIKE ${`%${search}%`}
        )
      `
      : Prisma.sql``;
    const query = Prisma.sql`
      SELECT
      id AS value,
      nombre AS label
      FROM municipio
      WHERE 1=1 ${searchQuery}
      ORDER BY nombre ASC
      LIMIT 10;
      `;

    const data = (await this.prisma.$queryRaw(query)) as any[];

    const result = data.map((row) => ({
      ...row,
      value: row.value.toString(),
    }));

    return result;
  }
}
