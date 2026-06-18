import { motion } from "framer-motion";
import { Waves, Cloud, Server, Database, Activity, Globe, HardDrive, BarChart3, Users } from "lucide-react";

interface ArchNode {
  id: string; label: string; sublabel: string; icon: React.ElementType;
  color: string; bg: string; border: string; x: number; y: number;
  connections: string[];
}

const NODES: ArchNode[] = [
  { id:"sensors",    label:"IoT Sensors",      sublabel:"100+ global sensors",        icon:Waves,    color:"text-cyan-400",   bg:"bg-cyan-500/10",    border:"border-cyan-500/30",    x:5,   y:20, connections:["iotcore"] },
  { id:"vessels",    label:"Research Vessels", sublabel:"20 vessels worldwide",        icon:Globe,    color:"text-blue-400",   bg:"bg-blue-500/10",    border:"border-blue-500/30",    x:5,   y:50, connections:["iotcore"] },
  { id:"satellites", label:"Satellites",        sublabel:"12 satellite feeds",         icon:Activity, color:"text-purple-400", bg:"bg-purple-500/10",  border:"border-purple-500/30",  x:5,   y:80, connections:["kafka"]   },
  { id:"iotcore",    label:"AWS IoT Core",      sublabel:"MQTT · TLS · 100K conns",   icon:Cloud,    color:"text-orange-400", bg:"bg-orange-500/10",  border:"border-orange-500/30",  x:30,  y:35, connections:["kafka"]   },
  { id:"kafka",      label:"Amazon MSK Kafka",  sublabel:"3 brokers · 12 topics",     icon:Activity, color:"text-yellow-400", bg:"bg-yellow-500/10",  border:"border-yellow-500/30",  x:50,  y:15, connections:["eks"]     },
  { id:"eks",        label:"Amazon EKS",        sublabel:"5 node groups · K8s 1.29",  icon:Server,   color:"text-ocean-300",  bg:"bg-ocean-500/10",   border:"border-ocean-500/30",   x:70,  y:35, connections:["rds","s3","opensearch"] },
  { id:"rds",        label:"RDS TimescaleDB",   sublabel:"Multi-AZ · PITR backups",   icon:Database, color:"text-green-400",  bg:"bg-green-500/10",   border:"border-green-500/30",   x:55,  y:65, connections:["grafana"] },
  { id:"s3",         label:"Amazon S3",         sublabel:"68 TB · Glacier archive",   icon:HardDrive,color:"text-amber-400",  bg:"bg-amber-500/10",   border:"border-amber-500/30",   x:70,  y:65, connections:["grafana"] },
  { id:"opensearch", label:"OpenSearch",         sublabel:"Metadata catalog · logs",  icon:Database, color:"text-pink-400",   bg:"bg-pink-500/10",    border:"border-pink-500/30",    x:85,  y:50, connections:["grafana"] },
  { id:"grafana",    label:"Grafana + Prometheus",sublabel:"100% observability",      icon:BarChart3,color:"text-orange-400", bg:"bg-orange-500/10",  border:"border-orange-500/30",  x:85,  y:20, connections:["users"]   },
  { id:"users",      label:"Users & APIs",       sublabel:"REST · GraphQL · Portal",  icon:Users,    color:"text-teal-400",   bg:"bg-teal-500/10",    border:"border-teal-500/30",    x:93,  y:75, connections:[]          },
];

const NODE_MAP = Object.fromEntries(NODES.map(n => [n.id, n]));

const LAYERS = [
  { label: "Data Sources",   x1:"0%",   x2:"20%",  color: "rgba(14,165,233,0.04)"  },
  { label: "Ingestion",      x1:"20%",  x2:"45%",  color: "rgba(234,179,8,0.04)"   },
  { label: "Processing",     x1:"45%",  x2:"70%",  color: "rgba(14,165,233,0.04)"  },
  { label: "Storage",        x1:"70%",  x2:"90%",  color: "rgba(16,185,129,0.04)"  },
  { label: "Observability",  x1:"90%",  x2:"100%", color: "rgba(249,115,22,0.04)"  },
];

function ArchCard({ node, idx }: { node: ArchNode; idx: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: idx * 0.08, type: "spring", stiffness: 200 }}
      whileHover={{ scale: 1.05, zIndex: 10 }}
      className={`absolute transform -translate-x-1/2 -translate-y-1/2
                  glass-card border ${node.border} ${node.bg} p-3 cursor-pointer
                  w-32 text-center group transition-all duration-200`}
      style={{ left: `${node.x}%`, top: `${node.y}%` }}
    >
      <div className={`w-9 h-9 rounded-xl mx-auto mb-1.5 flex items-center justify-center
                       ${node.bg} border ${node.border}`}>
        <node.icon className={`w-4 h-4 ${node.color}`} />
      </div>
      <p className="text-[11px] font-semibold text-white leading-tight">{node.label}</p>
      <p className="text-[9px] text-slate-500 mt-0.5 leading-tight group-hover:text-slate-400 transition-colors">
        {node.sublabel}
      </p>
    </motion.div>
  );
}

export default function Architecture() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">System Architecture</h2>
        <p className="text-slate-500 text-sm mt-0.5">
          Cloud-native architecture on AWS · EKS · Multi-region · GitOps
        </p>
      </div>

      {/* Architecture diagram */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6 relative overflow-hidden"
        style={{ height: 500 }}
      >
        {/* Layer bands */}
        {LAYERS.map(layer => (
          <div key={layer.label}
            className="absolute top-8 bottom-8 flex flex-col items-center"
            style={{ left: layer.x1, right: `calc(100% - ${layer.x2})`,
                     background: layer.color, borderRight: "1px dashed rgba(255,255,255,0.04)" }}>
            <p className="text-[9px] text-slate-600 uppercase tracking-wider mt-2 px-1 text-center">
              {layer.label}
            </p>
          </div>
        ))}

        {/* SVG connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex:1 }}>
          {NODES.flatMap(node =>
            node.connections.map(targetId => {
              const target = NODE_MAP[targetId];
              if (!target) return null;
              return (
                <motion.line
                  key={`${node.id}-${targetId}`}
                  x1={`${node.x}%`} y1={`${node.y}%`}
                  x2={`${target.x}%`} y2={`${target.y}%`}
                  stroke="rgba(14,165,233,0.3)"
                  strokeWidth={1.5}
                  strokeDasharray="6 4"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                />
              );
            })
          )}
          {/* Animated flow dots */}
          {NODES.flatMap(node =>
            node.connections.map((targetId, ci) => {
              const target = NODE_MAP[targetId];
              if (!target) return null;
              return (
                <motion.circle
                  key={`dot-${node.id}-${targetId}`}
                  r={3}
                  fill="#0ea5e9"
                  opacity={0.8}
                  animate={{
                    offsetDistance: ["0%","100%"],
                  }}
                  style={{
                    offsetPath: `path('M ${node.x * 9.5} ${node.y * 4.5} L ${target.x * 9.5} ${target.y * 4.5}')`,
                  }}
                >
                  <animateMotion
                    dur={`${2 + ci}s`} repeatCount="indefinite"
                    path={`M ${node.x}% ${node.y}% L ${target.x}% ${target.y}%`}
                  />
                </motion.circle>
              );
            })
          )}
        </svg>

        {/* Nodes */}
        {NODES.map((node, i) => <ArchCard key={node.id} node={node} idx={i} />)}
      </motion.div>

      {/* Component cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {[
          { title:"EKS Cluster",     items:["5 node groups","100+ pods","Karpenter autoscaler","Istio service mesh"],          color:"text-ocean-300",  bg:"bg-ocean-500/10",  border:"border-ocean-500/20"  },
          { title:"Data Ingestion",  items:["AWS IoT Core","Amazon MSK Kafka","Kinesis Firehose","1M events/sec capacity"],    color:"text-yellow-400", bg:"bg-yellow-500/10", border:"border-yellow-500/20" },
          { title:"Storage Layer",   items:["TimescaleDB (RDS)","S3 Data Lake","OpenSearch catalog","ElastiCache Redis"],      color:"text-green-400",  bg:"bg-green-500/10",  border:"border-green-500/20"  },
          { title:"Security",        items:["AWS WAF + Shield","HashiCorp Vault","Falco runtime","Zero-trust policies"],        color:"text-red-400",    bg:"bg-red-500/10",    border:"border-red-500/20"    },
          { title:"Observability",   items:["Prometheus + Thanos","Grafana dashboards","Loki log aggregation","Jaeger tracing"],color:"text-purple-400", bg:"bg-purple-500/10", border:"border-purple-500/20" },
          { title:"CI/CD",           items:["GitHub Actions","ArgoCD GitOps","Jenkins pipelines","ECR image registry"],        color:"text-cyan-400",   bg:"bg-cyan-500/10",   border:"border-cyan-500/20"   },
          { title:"Disaster Recovery",items:["Multi-AZ deployment","Cross-region DR","RTO: 15min / RPO: 5min","AWS Backup"],   color:"text-amber-400",  bg:"bg-amber-500/10",  border:"border-amber-500/20"  },
          { title:"Networking",      items:["VPC with 3 AZs","Route53 failover","CloudFront CDN","Private subnets"],           color:"text-teal-400",   bg:"bg-teal-500/10",   border:"border-teal-500/20"   },
        ].map((card, i) => (
          <motion.div key={card.title}
            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 + i*0.06 }}
            className={`glass-card p-4 border ${card.border} ${card.bg}`}>
            <p className={`text-sm font-semibold mb-2 ${card.color}`}>{card.title}</p>
            <ul className="space-y-1">
              {card.items.map(item => (
                <li key={item} className="flex items-center gap-2 text-xs text-slate-400">
                  <span className={`w-1 h-1 rounded-full shrink-0 ${card.color.replace("text-","bg-")}`} />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
