const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const app = express();
app.use(express.json({ limit: '16kb' }));
app.use(express.static(path.join(__dirname, 'public')));
const file = path.join(__dirname, 'data', 'camiones.json');
fs.mkdirSync(path.dirname(file), { recursive: true });
const stages = [
  'En viaje', 'Anunciado', 'Habilitado', 'Pesado lleno',
  'En descarga', 'Espera de balanza', 'Llamado a balanza',
  'Pesado vacío', 'Documentación entregada', 'Salió'
];
let trucks = fs.existsSync(file)
  ? JSON.parse(fs.readFileSync(file, 'utf8')) : [];
trucks = trucks.map((t,i) => ({
  ...t,
  ticket: t.ticket || 'S-' + String(i+1).padStart(5,'0'),
  estado: ({
    'Esperando':'Anunciado',
    'Pendiente de tara':'Espera de balanza',
    'Finalizado':'Pesado vacío'
  })[t.estado] || t.estado,
  historial: t.historial || []
}));
function save(next) {
  fs.writeFileSync(file+'.tmp', JSON.stringify(next,null,2));
  fs.renameSync(file+'.tmp',file);
  trucks=next;
}
function reject(res,message,status=400) {
  return res.status(status).json({error:message});
}
function text(value) {
  return typeof value==='string' ? value.trim().slice(0,120) : '';
}
function weight(value) {
  const n=Number(value);
  return Number.isFinite(n)&&n>0&&n<=100000 ? n : null;
}
app.get('/api/camiones',(req,res)=>res.json(trucks));
app.post('/api/camiones',(req,res)=>{
  const item={};
  for(const field of ['chofer','patente','productor','origen','cereal']){
    item[field]=text(req.body?.[field]);
    if(!item[field])return reject(res,'Completá: '+field);
  }
  item.patente=item.patente.toUpperCase();
  if(trucks.some(t=>t.patente===item.patente&&t.estado!=='Salió'))
    return reject(res,'Esta patente ya tiene un viaje abierto.');
  item.declarado=req.body.declarado ? weight(req.body.declarado) : null;
  if(req.body.declarado&&!item.declarado)
    return reject(res,'Revisá los kg declarados.');
  item.remito=text(req.body.remito);
  item.id=randomUUID();
  item.ticket='S-'+randomUUID().slice(0,8).toUpperCase();
  item.ingreso=new Date().toISOString();
  item.estado=req.body.tipo==='viaje'?'En viaje':'Anunciado';
  if(item.estado==='Anunciado')item.llegada=item.ingreso;
  item.historial=[{estado:item.estado,fecha:item.ingreso}];
  save([item,...trucks]);
  res.status(201).json(item);
});
app.post('/api/camiones/:id',(req,res)=>{
  const old=trucks.find(t=>t.id===req.params.id);
  if(!old)return reject(res,'No se encontró el viaje.',404);
  if(req.body?.estadoAnterior!==old.estado)
    return reject(res,'Otra persona actualizó el viaje. Actualizá el tablero.',409);
  const index=stages.indexOf(old.estado);
  if(index<0||index===stages.length-1)
    return reject(res,'Este viaje no admite otro avance.');
  const now=new Date().toISOString();
  const item={...old,historial:[...old.historial]};
  const occupied=trucks.some(t=>t.id!==old.id&&t.estado==='Llamado a balanza');
  if(old.estado==='En viaje')item.llegada=now;
  if(old.estado==='Anunciado')item.habilitado=now;
  if(old.estado==='Habilitado'){
    if(occupied)return reject(res,'La balanza está reservada para un camión de salida. Completá ese pesaje primero.');
    item.bruto=weight(req.body.bruto);
    item.destino=text(req.body.destino);
    if(!item.bruto||!item.destino)
      return reject(res,'Indicá peso lleno en kg y lugar de descarga.');
  }
  if(old.estado==='Espera de balanza'&&occupied)
    return reject(res,'Ya hay un camión llamado a balanza.');
  if(old.estado==='Llamado a balanza'){
    item.tara=weight(req.body.tara);
    if(!item.tara||item.tara>=item.bruto)
      return reject(res,'El peso vacío debe ser positivo y menor que el peso lleno.');
    item.neto=item.bruto-item.tara;
    item.pesajeFinal=now;
  }
  if(old.estado==='Pesado vacío'){
    item.certificado=text(req.body.certificado);
    if(!item.certificado)
      return reject(res,'Ingresá la referencia de la documentación entregada.');
  }
  if(old.estado==='Documentación entregada')item.salida=now;
  item.estado=stages[index+1];
  item.historial.push({estado:item.estado,fecha:now});
  save(trucks.map(t=>t.id===item.id?item:t));
  res.json(item);
});
app.use('/api/asistente', require('./asistente')(() => trucks));
app.use((err,req,res,next)=>{
  console.error(err.message);
  res.status(500).json({error:'No se pudo completar la operación.'});
});
app.listen(3000,'127.0.0.1',()=>console.log('SILO: circuito completo activo'));
