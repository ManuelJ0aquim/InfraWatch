export const SNMP_OIDS = {
  sysName: "1.3.6.1.2.1.1.5.0",       // Nome do dispositivo
  sysDescr: "1.3.6.1.2.1.1.1.0",      // Descrição do dispositivo
  sysUpTime: "1.3.6.1.2.1.1.3.0",     // Uptime
  cpuLoad1min: "1.3.6.1.4.1.2021.10.1.3.1", // Carga CPU 1 min
  memTotal: "1.3.6.1.4.1.2021.4.5.0", // Memória total
  memAvail: "1.3.6.1.4.1.2021.4.6.0", // Memória disponível

  ifIndex: "1.3.6.1.2.1.2.2.1.1",      // Índice da interface
  ifDescr: "1.3.6.1.2.1.2.2.1.2",      // Nome da interface
  ifType: "1.3.6.1.2.1.2.2.1.3",       // Tipo da interface (ethernet, loopback, etc)
  ifMtu: "1.3.6.1.2.1.2.2.1.4",        // MTU
  ifSpeed: "1.3.6.1.2.1.2.2.1.5",      // Velocidade
  ifPhysAddress: "1.3.6.1.2.1.2.2.1.6",// MAC
  ifAdminStatus: "1.3.6.1.2.1.2.2.1.7",// Status administrativo (up/down)
  ifOperStatus: "1.3.6.1.2.1.2.2.1.8", // Status operacional (up/down)
  ifInOctets: "1.3.6.1.2.1.2.2.1.10",  // Bytes recebidos
  ifOutOctets: "1.3.6.1.2.1.2.2.1.16", // Bytes enviados
  ifAlias: "1.3.6.1.2.1.31.1.1.1.18",  // Nome amigável da interface

  ipAddrTable: "1.3.6.1.2.1.4.20.1.2", // ipAdEntIfIndex -> mapeia IP para índice da interface
};
