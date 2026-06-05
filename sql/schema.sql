SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID('dbo.auditoria_eventos', 'U') IS NOT NULL DROP TABLE dbo.auditoria_eventos;
IF OBJECT_ID('dbo.archivos_equipo', 'U') IS NOT NULL DROP TABLE dbo.archivos_equipo;
IF OBJECT_ID('dbo.mantenimientos', 'U') IS NOT NULL DROP TABLE dbo.mantenimientos;
IF OBJECT_ID('dbo.asignaciones_equipos', 'U') IS NOT NULL DROP TABLE dbo.asignaciones_equipos;
IF OBJECT_ID('dbo.equipos', 'U') IS NOT NULL DROP TABLE dbo.equipos;
IF OBJECT_ID('dbo.colaboradores', 'U') IS NOT NULL DROP TABLE dbo.colaboradores;
IF OBJECT_ID('dbo.usuario_empresas', 'U') IS NOT NULL DROP TABLE dbo.usuario_empresas;
IF OBJECT_ID('dbo.usuarios', 'U') IS NOT NULL DROP TABLE dbo.usuarios;
IF OBJECT_ID('dbo.tipos_equipo', 'U') IS NOT NULL DROP TABLE dbo.tipos_equipo;
IF OBJECT_ID('dbo.empresas', 'U') IS NOT NULL DROP TABLE dbo.empresas;
IF OBJECT_ID('dbo.roles', 'U') IS NOT NULL DROP TABLE dbo.roles;
GO

CREATE TABLE dbo.roles (
  id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  codigo NVARCHAR(40) NOT NULL UNIQUE,
  nombre NVARCHAR(100) NOT NULL,
  puede_ver_todo BIT NOT NULL CONSTRAINT DF_roles_puede_ver_todo DEFAULT(0),
  created_at DATETIME2 NOT NULL CONSTRAINT DF_roles_created_at DEFAULT(SYSDATETIME())
);
GO

CREATE TABLE dbo.empresas (
  id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  nombre NVARCHAR(180) NOT NULL,
  rut_o_id NVARCHAR(50) NOT NULL,
  dominio NVARCHAR(120) NULL,
  contacto_principal NVARCHAR(160) NULL,
  correo_contacto NVARCHAR(160) NULL,
  telefono NVARCHAR(50) NULL,
  activa BIT NOT NULL CONSTRAINT DF_empresas_activa DEFAULT(1),
  created_at DATETIME2 NOT NULL CONSTRAINT DF_empresas_created_at DEFAULT(SYSDATETIME()),
  updated_at DATETIME2 NOT NULL CONSTRAINT DF_empresas_updated_at DEFAULT(SYSDATETIME()),
  CONSTRAINT UQ_empresas_rut_o_id UNIQUE (rut_o_id)
);
GO

CREATE TABLE dbo.tipos_equipo (
  id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  nombre NVARCHAR(100) NOT NULL,
  descripcion NVARCHAR(250) NULL,
  activo BIT NOT NULL CONSTRAINT DF_tipos_equipo_activo DEFAULT(1),
  created_at DATETIME2 NOT NULL CONSTRAINT DF_tipos_equipo_created_at DEFAULT(SYSDATETIME())
);
GO

CREATE TABLE dbo.usuarios (
  id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  rol_id INT NOT NULL,
  nombre NVARCHAR(160) NOT NULL,
  email NVARCHAR(160) NOT NULL,
  password_hash NVARCHAR(255) NOT NULL,
  activo BIT NOT NULL CONSTRAINT DF_usuarios_activo DEFAULT(1),
  ultimo_acceso_at DATETIME2 NULL,
  created_at DATETIME2 NOT NULL CONSTRAINT DF_usuarios_created_at DEFAULT(SYSDATETIME()),
  updated_at DATETIME2 NOT NULL CONSTRAINT DF_usuarios_updated_at DEFAULT(SYSDATETIME()),
  CONSTRAINT UQ_usuarios_email UNIQUE (email),
  CONSTRAINT FK_usuarios_roles FOREIGN KEY (rol_id) REFERENCES dbo.roles(id)
);
GO

CREATE TABLE dbo.usuario_empresas (
  id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  usuario_id INT NOT NULL,
  empresa_id INT NOT NULL,
  es_principal BIT NOT NULL CONSTRAINT DF_usuario_empresas_es_principal DEFAULT(0),
  created_at DATETIME2 NOT NULL CONSTRAINT DF_usuario_empresas_created_at DEFAULT(SYSDATETIME()),
  CONSTRAINT UQ_usuario_empresas UNIQUE (usuario_id, empresa_id),
  CONSTRAINT FK_usuario_empresas_usuario FOREIGN KEY (usuario_id) REFERENCES dbo.usuarios(id) ON DELETE CASCADE,
  CONSTRAINT FK_usuario_empresas_empresa FOREIGN KEY (empresa_id) REFERENCES dbo.empresas(id) ON DELETE CASCADE
);
GO

CREATE TABLE dbo.colaboradores (
  id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  empresa_id INT NOT NULL,
  codigo_colaborador NVARCHAR(60) NOT NULL,
  nombres NVARCHAR(120) NOT NULL,
  apellidos NVARCHAR(120) NOT NULL,
  email NVARCHAR(160) NULL,
  cargo NVARCHAR(120) NULL,
  telefono NVARCHAR(50) NULL,
  activo BIT NOT NULL CONSTRAINT DF_colaboradores_activo DEFAULT(1),
  created_at DATETIME2 NOT NULL CONSTRAINT DF_colaboradores_created_at DEFAULT(SYSDATETIME()),
  updated_at DATETIME2 NOT NULL CONSTRAINT DF_colaboradores_updated_at DEFAULT(SYSDATETIME()),
  CONSTRAINT UQ_colaboradores_empresa_codigo UNIQUE (empresa_id, codigo_colaborador),
  CONSTRAINT FK_colaboradores_empresa FOREIGN KEY (empresa_id) REFERENCES dbo.empresas(id)
);
GO

CREATE TABLE dbo.equipos (
  id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  empresa_id INT NOT NULL,
  tipo_equipo_id INT NOT NULL,
  colaborador_id INT NULL,
  codigo_interno NVARCHAR(80) NOT NULL,
  serial NVARCHAR(120) NULL,
  marca NVARCHAR(120) NULL,
  modelo NVARCHAR(120) NULL,
  color NVARCHAR(60) NULL,
  estado NVARCHAR(40) NOT NULL CONSTRAINT DF_equipos_estado DEFAULT('Disponible'),
  condicion NVARCHAR(40) NOT NULL CONSTRAINT DF_equipos_condicion DEFAULT('Operativo'),
  propiedad NVARCHAR(20) NOT NULL CONSTRAINT DF_equipos_propiedad DEFAULT('Propio'),
  fecha_compra DATE NULL,
  costo_estimado DECIMAL(18,2) NULL,
  observaciones NVARCHAR(500) NULL,
  created_at DATETIME2 NOT NULL CONSTRAINT DF_equipos_created_at DEFAULT(SYSDATETIME()),
  updated_at DATETIME2 NOT NULL CONSTRAINT DF_equipos_updated_at DEFAULT(SYSDATETIME()),
  CONSTRAINT UQ_equipos_empresa_codigo UNIQUE (empresa_id, codigo_interno),
  CONSTRAINT UQ_equipos_empresa_serial UNIQUE (empresa_id, serial),
  CONSTRAINT FK_equipos_empresa FOREIGN KEY (empresa_id) REFERENCES dbo.empresas(id),
  CONSTRAINT FK_equipos_tipo FOREIGN KEY (tipo_equipo_id) REFERENCES dbo.tipos_equipo(id),
  CONSTRAINT FK_equipos_colaborador FOREIGN KEY (colaborador_id) REFERENCES dbo.colaboradores(id)
);
GO

CREATE TABLE dbo.asignaciones_equipos (
  id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  empresa_id INT NOT NULL,
  equipo_id INT NOT NULL,
  colaborador_id INT NOT NULL,
  asignado_por_usuario_id INT NOT NULL,
  fecha_asignacion DATETIME2 NOT NULL CONSTRAINT DF_asignaciones_fecha_asignacion DEFAULT(SYSDATETIME()),
  fecha_devolucion DATETIME2 NULL,
  estado NVARCHAR(40) NOT NULL CONSTRAINT DF_asignaciones_estado DEFAULT('Activa'),
  observaciones NVARCHAR(500) NULL,
  created_at DATETIME2 NOT NULL CONSTRAINT DF_asignaciones_created_at DEFAULT(SYSDATETIME()),
  updated_at DATETIME2 NOT NULL CONSTRAINT DF_asignaciones_updated_at DEFAULT(SYSDATETIME()),
  CONSTRAINT FK_asignaciones_empresa FOREIGN KEY (empresa_id) REFERENCES dbo.empresas(id),
  CONSTRAINT FK_asignaciones_equipo FOREIGN KEY (equipo_id) REFERENCES dbo.equipos(id),
  CONSTRAINT FK_asignaciones_colaborador FOREIGN KEY (colaborador_id) REFERENCES dbo.colaboradores(id),
  CONSTRAINT FK_asignaciones_usuario FOREIGN KEY (asignado_por_usuario_id) REFERENCES dbo.usuarios(id)
);
GO

CREATE TABLE dbo.mantenimientos (
  id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  empresa_id INT NOT NULL,
  equipo_id INT NOT NULL,
  asignacion_id INT NULL,
  tipo NVARCHAR(40) NOT NULL,
  prioridad NVARCHAR(20) NOT NULL CONSTRAINT DF_mantenimientos_prioridad DEFAULT('Media'),
  estado NVARCHAR(40) NOT NULL CONSTRAINT DF_mantenimientos_estado DEFAULT('Pendiente'),
  fecha_programada DATETIME2 NULL,
  fecha_ejecucion DATETIME2 NULL,
  tecnico_responsable NVARCHAR(160) NULL,
  descripcion NVARCHAR(1000) NULL,
  resultado NVARCHAR(1000) NULL,
  costo DECIMAL(18,2) NULL,
  created_at DATETIME2 NOT NULL CONSTRAINT DF_mantenimientos_created_at DEFAULT(SYSDATETIME()),
  updated_at DATETIME2 NOT NULL CONSTRAINT DF_mantenimientos_updated_at DEFAULT(SYSDATETIME()),
  CONSTRAINT FK_mantenimientos_empresa FOREIGN KEY (empresa_id) REFERENCES dbo.empresas(id),
  CONSTRAINT FK_mantenimientos_equipo FOREIGN KEY (equipo_id) REFERENCES dbo.equipos(id),
  CONSTRAINT FK_mantenimientos_asignacion FOREIGN KEY (asignacion_id) REFERENCES dbo.asignaciones_equipos(id)
);
GO

CREATE TABLE dbo.archivos_equipo (
  id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  empresa_id INT NOT NULL,
  equipo_id INT NOT NULL,
  mantenimiento_id INT NULL,
  tipo_archivo NVARCHAR(40) NOT NULL,
  nombre_original NVARCHAR(255) NOT NULL,
  nombre_guardado NVARCHAR(255) NULL,
  dropbox_path NVARCHAR(500) NOT NULL,
  dropbox_id NVARCHAR(200) NULL,
  shared_link NVARCHAR(500) NULL,
  mime_type NVARCHAR(120) NULL,
  tamano_bytes BIGINT NULL,
  checksum NVARCHAR(120) NULL,
  created_at DATETIME2 NOT NULL CONSTRAINT DF_archivos_equipo_created_at DEFAULT(SYSDATETIME()),
  CONSTRAINT FK_archivos_empresa FOREIGN KEY (empresa_id) REFERENCES dbo.empresas(id),
  CONSTRAINT FK_archivos_equipo_equipo FOREIGN KEY (equipo_id) REFERENCES dbo.equipos(id),
  CONSTRAINT FK_archivos_mantenimiento FOREIGN KEY (mantenimiento_id) REFERENCES dbo.mantenimientos(id)
);
GO

CREATE TABLE dbo.auditoria_eventos (
  id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  empresa_id INT NULL,
  usuario_id INT NULL,
  entidad NVARCHAR(100) NOT NULL,
  entidad_id NVARCHAR(100) NULL,
  accion NVARCHAR(80) NOT NULL,
  detalle NVARCHAR(1000) NULL,
  ip NVARCHAR(80) NULL,
  created_at DATETIME2 NOT NULL CONSTRAINT DF_auditoria_eventos_created_at DEFAULT(SYSDATETIME()),
  CONSTRAINT FK_auditoria_empresa FOREIGN KEY (empresa_id) REFERENCES dbo.empresas(id),
  CONSTRAINT FK_auditoria_usuario FOREIGN KEY (usuario_id) REFERENCES dbo.usuarios(id)
);
GO

CREATE INDEX IX_colaboradores_empresa ON dbo.colaboradores(empresa_id);
CREATE INDEX IX_equipos_empresa ON dbo.equipos(empresa_id);
CREATE INDEX IX_asignaciones_empresa ON dbo.asignaciones_equipos(empresa_id);
CREATE INDEX IX_mantenimientos_empresa ON dbo.mantenimientos(empresa_id);
CREATE INDEX IX_archivos_empresa ON dbo.archivos_equipo(empresa_id);
CREATE INDEX IX_auditoria_empresa ON dbo.auditoria_eventos(empresa_id);
GO

INSERT INTO dbo.roles (codigo, nombre, puede_ver_todo)
SELECT 'admin', 'Administrador', 1
WHERE NOT EXISTS (SELECT 1 FROM dbo.roles WHERE codigo = 'admin');

INSERT INTO dbo.roles (codigo, nombre, puede_ver_todo)
SELECT 'operador', 'Operador', 0
WHERE NOT EXISTS (SELECT 1 FROM dbo.roles WHERE codigo = 'operador');

INSERT INTO dbo.roles (codigo, nombre, puede_ver_todo)
SELECT 'consulta', 'Consulta', 0
WHERE NOT EXISTS (SELECT 1 FROM dbo.roles WHERE codigo = 'consulta');
GO
