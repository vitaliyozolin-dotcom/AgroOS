#!/usr/bin/env python3
"""Evidence-first decision engine for Grant & Subsidy Hunter."""
from __future__ import annotations
import argparse,json,sys
from datetime import date,datetime
from pathlib import Path
from typing import Any,Dict,List,Tuple
REQUIRED_FIELDS={"id","program_name","operator","source","deadline","award_amount_rub","mandatory_cofinancing_rub","preparation_cost_rub","compliance_cost_rub","probability_of_success","eligibility_confidence","strategic_fit_score","time_to_cash_score","preparation_ease_score","reuse_score","critical_eligibility_checks"}
def clamp(v:float,low:float=0.0,high:float=100.0)->float:return max(low,min(high,v))
def parse_deadline(v:str)->date:return datetime.fromisoformat(v.replace("Z","+00:00")).date()
def validate(d:Dict[str,Any])->List[str]:
 e=[];m=sorted(REQUIRED_FIELDS-d.keys())
 if m:e.append("missing_fields: "+", ".join(m))
 s=d.get("source",{})
 if s.get("trust_level") not in {"official_primary","official_operator"}:e.append("source_not_official")
 if not s.get("url"):e.append("source_url_missing")
 if not s.get("captured_at"):e.append("source_capture_time_missing")
 p=d.get("probability_of_success")
 if p is not None and not 0<=float(p)<=1:e.append("probability_of_success_must_be_0_to_1")
 for f in ("eligibility_confidence","strategic_fit_score","time_to_cash_score","preparation_ease_score","reuse_score"):
  if f in d and not 0<=float(d[f])<=100:e.append(f"{f}_must_be_0_to_100")
 return e
def checks(items:List[Dict[str,Any]])->Tuple[List[str],List[str]]:
 failed=[];unknown=[]
 for c in items:
  n=str(c.get("name","unnamed_check"));s=c.get("status")
  if s is False:failed.append(n)
  elif s is None or s=="unknown":unknown.append(n)
 return failed,unknown
def calculate(d:Dict[str,Any],as_of:date)->Dict[str,Any]:
 e=validate(d)
 if e:return {"id":d.get("id"),"decision":"EVIDENCE_PENDING","score":0,"validation_errors":e,"next_action":"Complete evidence and required fields before eligibility scoring."}
 deadline=parse_deadline(str(d["deadline"]))
 if deadline<as_of:return {"id":d["id"],"decision":"REJECT","score":0,"reason":"deadline_expired","deadline":deadline.isoformat()}
 failed,unknown=checks(d["critical_eligibility_checks"])
 if failed:return {"id":d["id"],"decision":"REJECT","score":0,"reason":"critical_eligibility_failed","failed_checks":failed}
 award=float(d["award_amount_rub"]);co=float(d["mandatory_cofinancing_rub"]);prep=float(d["preparation_cost_rub"]);comp=float(d["compliance_cost_rub"]);prob=float(d["probability_of_success"]);capital=float(d.get("cofinancing_cost_rate",.20))
 expected=award*prob-prep-comp-co*capital;evs=clamp((expected/award if award>0 else -1)*100)
 score=round(float(d["eligibility_confidence"])*.25+float(d["strategic_fit_score"])*.20+evs*.20+prob*100*.15+float(d["time_to_cash_score"])*.10+float(d["preparation_ease_score"])*.05+float(d["reuse_score"])*.05,1);days=(deadline-as_of).days
 if unknown:decision="EVIDENCE_PENDING";action="Resolve critical unknowns: "+", ".join(unknown)
 elif expected<=0:decision="REJECT";action="Do not apply: expected value is non-positive."
 elif score>=75 and days>=7:decision="APPLY";action="Open application workstream and obtain human approval."
 elif score>=50:decision="WATCH";action="Close eligibility/economics gaps or wait for the next round."
 else:decision="REJECT";action="Archive with reason and retain learnings."
 return {"id":d["id"],"program_name":d["program_name"],"decision":decision,"score":score,"deadline":deadline.isoformat(),"days_left":days,"expected_value_rub":round(expected,2),"unknown_checks":unknown,"next_action":action,"evidence":{"operator":d["operator"],"source_url":d["source"]["url"],"captured_at":d["source"]["captured_at"]}}
def main()->int:
 p=argparse.ArgumentParser();p.add_argument("opportunity",type=Path);p.add_argument("--as-of",default=date.today().isoformat());a=p.parse_args()
 try:r=calculate(json.loads(a.opportunity.read_text(encoding="utf-8")),date.fromisoformat(a.as_of))
 except (OSError,ValueError,TypeError,json.JSONDecodeError) as x:print(json.dumps({"error":str(x)},ensure_ascii=False,indent=2));return 2
 print(json.dumps(r,ensure_ascii=False,indent=2));return 0
if __name__=="__main__":sys.exit(main())
