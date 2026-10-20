import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import {
  BalanceSolution,
  ChainSolution,
  CompoundData,
  ConditionData,
  ElementData,
  FormulaData,
  HeuristicData,
  MetaData,
  QuantitySolution,
  ReactionData,
  ReagentData,
  RuleData,
  TemplateData,
} from '../models/chemistry.models';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1';

  // --- SOLVERS ---
  solveBalance(equation: string): Observable<BalanceSolution> {
    return this.http
      .post<BalanceSolution>(`${this.baseUrl}/solve/balance`, { equation })
      .pipe(catchError(this.handleError));
  }

  solveChain(start: string, target: string, maxSteps = 6): Observable<ChainSolution> {
    return this.http
      .post<ChainSolution>(`${this.baseUrl}/solve/chain`, {
        start,
        target,
        max_steps: maxSteps,
      })
      .pipe(catchError(this.handleError));
  }

  solveQuantity(payload: {
    equation: string;
    known: { formula: string; kind: string; value: number };
    find: { formula: string; kind: string };
  }): Observable<QuantitySolution> {
    return this.http
      .post<QuantitySolution>(`${this.baseUrl}/solve/quantity`, payload)
      .pipe(catchError(this.handleError));
  }

  // --- META ---
  getMeta(): Observable<MetaData> {
    return this.http
      .get<MetaData>(`${this.baseUrl}/meta`)
      .pipe(catchError(this.handleError));
  }

  // --- CRUD: ELEMENTS (E) ---
  listElements(q?: string): Observable<ElementData[]> {
    const params: Record<string, string> = {};
    if (q) params['q'] = q;
    return this.http
      .get<{ count: number; items: ElementData[] }>(`${this.baseUrl}/elements`, { params })
      .pipe(map((res) => res.items || []), catchError(this.handleError));
  }

  getElement(symbol: string): Observable<ElementData> {
    return this.http
      .get<ElementData>(`${this.baseUrl}/elements/${encodeURIComponent(symbol)}`)
      .pipe(catchError(this.handleError));
  }

  createElement(data: Partial<ElementData>): Observable<ElementData> {
    return this.http
      .post<ElementData>(`${this.baseUrl}/elements`, data)
      .pipe(catchError(this.handleError));
  }

  updateElement(symbol: string, data: Partial<ElementData>): Observable<ElementData> {
    return this.http
      .put<ElementData>(`${this.baseUrl}/elements/${encodeURIComponent(symbol)}`, data)
      .pipe(catchError(this.handleError));
  }

  deleteElement(symbol: string): Observable<any> {
    return this.http
      .delete(`${this.baseUrl}/elements/${encodeURIComponent(symbol)}`)
      .pipe(catchError(this.handleError));
  }

  // --- CRUD: COMPOUNDS (C) ---
  listCompounds(q?: string, compoundClass?: string): Observable<CompoundData[]> {
    const params: Record<string, string> = {};
    if (q) params['q'] = q;
    if (compoundClass) params['class'] = compoundClass;
    return this.http
      .get<{ count: number; items: CompoundData[] }>(`${this.baseUrl}/compounds`, { params })
      .pipe(map((res) => res.items || []), catchError(this.handleError));
  }

  getCompound(formula: string): Observable<CompoundData> {
    return this.http
      .get<CompoundData>(`${this.baseUrl}/compounds/${encodeURIComponent(formula)}`)
      .pipe(catchError(this.handleError));
  }

  createCompound(data: Partial<CompoundData>): Observable<CompoundData> {
    return this.http
      .post<CompoundData>(`${this.baseUrl}/compounds`, data)
      .pipe(catchError(this.handleError));
  }

  updateCompound(formula: string, data: Partial<CompoundData>): Observable<CompoundData> {
    return this.http
      .put<CompoundData>(`${this.baseUrl}/compounds/${encodeURIComponent(formula)}`, data)
      .pipe(catchError(this.handleError));
  }

  deleteCompound(formula: string): Observable<any> {
    return this.http
      .delete(`${this.baseUrl}/compounds/${encodeURIComponent(formula)}`)
      .pipe(catchError(this.handleError));
  }

  // --- CRUD: REACTIONS (R) ---
  listReactions(q?: string, substance?: string, type?: string, condition?: string): Observable<ReactionData[]> {
    const params: Record<string, string> = {};
    if (q) params['q'] = q;
    if (substance) params['substance'] = substance;
    if (type) params['type'] = type;
    if (condition) params['condition'] = condition;
    return this.http
      .get<{ count: number; items: ReactionData[] }>(`${this.baseUrl}/reactions`, { params })
      .pipe(map((res) => res.items || []), catchError(this.handleError));
  }

  getReaction(id: string): Observable<ReactionData> {
    return this.http
      .get<ReactionData>(`${this.baseUrl}/reactions/${encodeURIComponent(id)}`)
      .pipe(catchError(this.handleError));
  }

  createReaction(data: Partial<ReactionData>): Observable<ReactionData> {
    return this.http
      .post<ReactionData>(`${this.baseUrl}/reactions`, data)
      .pipe(catchError(this.handleError));
  }

  updateReaction(id: string, data: Partial<ReactionData>): Observable<ReactionData> {
    return this.http
      .put<ReactionData>(`${this.baseUrl}/reactions/${encodeURIComponent(id)}`, data)
      .pipe(catchError(this.handleError));
  }

  deleteReaction(id: string): Observable<any> {
    return this.http
      .delete(`${this.baseUrl}/reactions/${encodeURIComponent(id)}`)
      .pipe(catchError(this.handleError));
  }

  // --- CRUD: RULES (L) ---
  listRules(q?: string): Observable<RuleData[]> {
    const params: Record<string, string> = {};
    if (q) params['q'] = q;
    return this.http
      .get<{ count: number; items: RuleData[] }>(`${this.baseUrl}/rules`, { params })
      .pipe(map((res) => res.items || []), catchError(this.handleError));
  }

  createRule(data: Partial<RuleData>): Observable<RuleData> {
    return this.http
      .post<RuleData>(`${this.baseUrl}/rules`, data)
      .pipe(catchError(this.handleError));
  }

  updateRule(id: string, data: Partial<RuleData>): Observable<RuleData> {
    return this.http
      .put<RuleData>(`${this.baseUrl}/rules/${encodeURIComponent(id)}`, data)
      .pipe(catchError(this.handleError));
  }

  deleteRule(id: string): Observable<any> {
    return this.http
      .delete(`${this.baseUrl}/rules/${encodeURIComponent(id)}`)
      .pipe(catchError(this.handleError));
  }

  // --- CRUD: CONDITIONS (Cond) ---
  listConditions(q?: string): Observable<ConditionData[]> {
    const params: Record<string, string> = {};
    if (q) params['q'] = q;
    return this.http
      .get<{ count: number; items: ConditionData[] }>(`${this.baseUrl}/conditions`, { params })
      .pipe(map((res) => res.items || []), catchError(this.handleError));
  }

  createCondition(data: Partial<ConditionData>): Observable<ConditionData> {
    return this.http
      .post<ConditionData>(`${this.baseUrl}/conditions`, data)
      .pipe(catchError(this.handleError));
  }

  updateCondition(code: string, data: Partial<ConditionData>): Observable<ConditionData> {
    return this.http
      .put<ConditionData>(`${this.baseUrl}/conditions/${encodeURIComponent(code)}`, data)
      .pipe(catchError(this.handleError));
  }

  deleteCondition(code: string): Observable<any> {
    return this.http
      .delete(`${this.baseUrl}/conditions/${encodeURIComponent(code)}`)
      .pipe(catchError(this.handleError));
  }

  // --- CRUD: HEURISTICS (H) ---
  listHeuristics(q?: string): Observable<HeuristicData[]> {
    const params: Record<string, string> = {};
    if (q) params['q'] = q;
    return this.http
      .get<{ count: number; items: HeuristicData[] }>(`${this.baseUrl}/heuristics`, { params })
      .pipe(map((res) => res.items || []), catchError(this.handleError));
  }

  createHeuristic(data: Partial<HeuristicData>): Observable<HeuristicData> {
    return this.http
      .post<HeuristicData>(`${this.baseUrl}/heuristics`, data)
      .pipe(catchError(this.handleError));
  }

  updateHeuristic(id: string, data: Partial<HeuristicData>): Observable<HeuristicData> {
    return this.http
      .put<HeuristicData>(`${this.baseUrl}/heuristics/${encodeURIComponent(id)}`, data)
      .pipe(catchError(this.handleError));
  }

  deleteHeuristic(id: string): Observable<any> {
    return this.http
      .delete(`${this.baseUrl}/heuristics/${encodeURIComponent(id)}`)
      .pipe(catchError(this.handleError));
  }

  // --- CRUD: FORMULAS (F) ---
  listFormulas(q?: string): Observable<FormulaData[]> {
    const params: Record<string, string> = {};
    if (q) params['q'] = q;
    return this.http
      .get<{ count: number; items: FormulaData[] }>(`${this.baseUrl}/formulas`, { params })
      .pipe(map((res) => res.items || []), catchError(this.handleError));
  }

  createFormula(data: Partial<FormulaData>): Observable<FormulaData> {
    return this.http
      .post<FormulaData>(`${this.baseUrl}/formulas`, data)
      .pipe(catchError(this.handleError));
  }

  updateFormula(id: string, data: Partial<FormulaData>): Observable<FormulaData> {
    return this.http
      .put<FormulaData>(`${this.baseUrl}/formulas/${encodeURIComponent(id)}`, data)
      .pipe(catchError(this.handleError));
  }

  deleteFormula(id: string): Observable<any> {
    return this.http
      .delete(`${this.baseUrl}/formulas/${encodeURIComponent(id)}`)
      .pipe(catchError(this.handleError));
  }

  // --- CRUD: REAGENTS ---
  listReagents(q?: string): Observable<ReagentData[]> {
    const params: Record<string, string> = {};
    if (q) params['q'] = q;
    return this.http
      .get<{ count: number; items: ReagentData[] }>(`${this.baseUrl}/reagents`, { params })
      .pipe(map((res) => res.items || []), catchError(this.handleError));
  }

  createReagent(data: Partial<ReagentData>): Observable<ReagentData> {
    return this.http
      .post<ReagentData>(`${this.baseUrl}/reagents`, data)
      .pipe(catchError(this.handleError));
  }

  updateReagent(formula: string, data: Partial<ReagentData>): Observable<ReagentData> {
    return this.http
      .put<ReagentData>(`${this.baseUrl}/reagents/${encodeURIComponent(formula)}`, data)
      .pipe(catchError(this.handleError));
  }

  deleteReagent(formula: string): Observable<any> {
    return this.http
      .delete(`${this.baseUrl}/reagents/${encodeURIComponent(formula)}`)
      .pipe(catchError(this.handleError));
  }

  // --- CRUD: TEMPLATES ---
  listTemplates(q?: string, problem?: string): Observable<TemplateData[]> {
    const params: Record<string, string> = {};
    if (q) params['q'] = q;
    if (problem) params['problem'] = problem;
    return this.http
      .get<{ count: number; items: TemplateData[] }>(`${this.baseUrl}/templates`, { params })
      .pipe(map((res) => res.items || []), catchError(this.handleError));
  }

  createTemplate(data: Partial<TemplateData>): Observable<TemplateData> {
    return this.http
      .post<TemplateData>(`${this.baseUrl}/templates`, data)
      .pipe(catchError(this.handleError));
  }

  updateTemplate(id: string, data: Partial<TemplateData>): Observable<TemplateData> {
    return this.http
      .put<TemplateData>(`${this.baseUrl}/templates/${encodeURIComponent(id)}`, data)
      .pipe(catchError(this.handleError));
  }

  deleteTemplate(id: string): Observable<any> {
    return this.http
      .delete(`${this.baseUrl}/templates/${encodeURIComponent(id)}`)
      .pipe(catchError(this.handleError));
  }

  // --- Helper for substance reactions ---
  getReactionsForSubstance(substance: string): Observable<ReactionData[]> {
    return this.listReactions(undefined, substance);
  }

  searchCompounds(q: string): Observable<CompoundData[]> {
    return this.listCompounds(q);
  }

  private handleError(error: HttpErrorResponse) {
    let msg = 'Đã có lỗi xảy ra khi kết nối máy chủ.';
    if (error.error?.detail) {
      msg = error.error.detail;
    } else if (typeof error.error === 'string') {
      msg = error.error;
    } else if (error.message) {
      msg = error.message;
    }
    return throwError(() => new Error(msg));
  }
}
