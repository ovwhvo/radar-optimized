// Display summaries only; official policy evidence and exported snapshots stay intact.
const purposes={
  'lg-rd-investment-2026':'为符合条件的龙岗科技企业提供研发投入补助。',
  'national-rd-tax-2023':'符合规定的研发费用可增加税前扣除，降低所得税负担。',
  'national-smallprofit-tax-2023':'符合小型微利企业条件，可按优惠规则缴纳企业所得税。',
  'sz-hightech-recognition-2026':'申请高新技术企业资格；取得资格后，其他优惠另行核对。',
  'sz-techsme-evaluation-2026':'申请年度科技型中小企业入库编号，衔接相关政策。',
  'sz-tech-contract-2026':'为已签订的技术合同申请登记证明，相关税费优惠另行核对。'
};
export const policyPurpose=p=>purposes[p.id]||p.summary;
export function windowCopy(p){
 const deadline=p.window?.close?.slice(0,10);
 switch(p.applicationStatus){
 case 'open':return {label:'官方指南：全年可申请',detail:'没有集中申请截止日。办理前请确认官方系统和最新要求。',kind:'available'};
 case 'tax_filing':case 'ongoing':return {label:'随企业所得税申报办理',detail:'在适用的预缴或年度汇算清缴时申报享受，按税务要求确认适用期间。',kind:'available'};
 case 'closed':return {label:deadline?'已收录批次于 '+deadline+' 截止':'已收录的申请批次已截止',detail:'目前收录的是已结束的批次。可以先准备资料，新申请请查主管部门后续通知。',kind:'ended'};
 case 'not_applicable':return {label:'办理时间请查看官方说明',detail:p.window?.note||'该事项没有集中申请批次。',kind:'uncertain'};
 default:return {label:'申请时间尚未确认',detail:'已查到政策规定，尚未确认对应申请通知和时间。可以先了解要求，暂不能据此判断现在可申请。',kind:'uncertain'};
 }
}
export const preparationOrder=['steps','materials','fields','review'];
export const preparationLabels={steps:'了解办理流程',materials:'收集所需材料',fields:'整理填写草稿',review:'检查并导出'};
export const taskDestination=task=>({materials:'查看所需材料',steps:'了解办理流程',forms:'整理填写草稿',explain:'了解这项政策'})[task]||'核对这项政策是否适合你';

