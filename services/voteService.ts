import { ref, onValue, set, update, remove, Unsubscribe, get, increment } from "firebase/database";
import { db } from "./firebase";
import { Candidate, COLORS, VoteCategory, Souvenir, VoteDetail, StaffMember } from '../types';

class VoteService {
  private listeners: Array<() => void> = [];
  public candidates: Candidate[] = [];
  public souvenirs: Souvenir[] = [];
  public voteDetails: VoteDetail[] = [];
  public staffRoster: StaffMember[] = [];
  private unsubs: Unsubscribe[] = [];
  
  public isGlobalTestMode = false;
  public isVotingOpen = true; 
  public useStaffVerification = true; 
  public logoUrl = "";
  public bgUrl = ""; 

  // Staff ID related states
  public masterKeyCount = 0;
  public authorizedStaffCount = 0;

  constructor() {
    this.seedDefaults();
  }

  private seedDefaults() {
    // Seed default souvenirs if none exist
    get(ref(db, 'souvenirs')).then((snap) => {
      if (!snap.exists()) {
        const defaultSouvenirs = {
          'souvenir_1': { name: '2026 TeamTalk 紀念馬克杯', quantity: 150, image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80' },
          'souvenir_2': { name: '2026 TeamTalk 帆布提袋', quantity: 100, image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400&q=80' },
          'souvenir_3': { name: '2026 TeamTalk 質感保溫瓶', quantity: 50, image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=400&q=80' },
        };
        set(ref(db, 'souvenirs'), defaultSouvenirs);
      }
    });

    // Seed default products if none exist
    get(ref(db, 'candidates')).then((snap) => {
      if (!snap.exists()) {
        const defaultCandidates = {
          'prod_1': { name: 'AI Smart Lens 智慧眼鏡', song: '穿戴式裝置', image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=400&q=80', scoreSinging: 0, scorePopularity: 0, scoreCostume: 0, voteCount: 0, totalScore: 0 },
          'prod_2': { name: 'TeamTalk Collab Board 協作白板', song: '軟體與通訊', image: 'https://images.unsplash.com/photo-1540350394557-8d14678e7f91?auto=format&fit=crop&w=400&q=80', scoreSinging: 0, scorePopularity: 0, scoreCostume: 0, voteCount: 0, totalScore: 0 },
          'prod_3': { name: 'Quantum AI Server 超算主機', song: '伺服器架構', image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80', scoreSinging: 0, scorePopularity: 0, scoreCostume: 0, voteCount: 0, totalScore: 0 },
          'prod_4': { name: 'EcoStream 能源監控器', song: '綠能與節能', image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=400&q=80', scoreSinging: 0, scorePopularity: 0, scoreCostume: 0, voteCount: 0, totalScore: 0 },
          'prod_5': { name: 'OmniHologram 3D 投影儀', song: '影像與顯示', image: 'https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=400&q=80', scoreSinging: 0, scorePopularity: 0, scoreCostume: 0, voteCount: 0, totalScore: 0 },
        };
        set(ref(db, 'candidates'), defaultCandidates);
      }
    });

    // Seed mock staff list if none exists to support easy testing
    get(ref(db, 'staff_list')).then((snap) => {
      if (!snap.exists()) {
        const demoStaff: any = {};
        for (let i = 1; i <= 200; i++) {
          const num = String(i).padStart(5, '0');
          demoStaff[`QA${num}`] = { used: false };
        }
        set(ref(db, 'staff_list'), demoStaff);
        set(ref(db, 'stats/authorizedStaffCount'), 200);
      }
    });
  }

  private generateRandomId(length: number = 32): string {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(l => l());
  }

  getCandidates(): Candidate[] { return this.candidates; }
  getSouvenirs(): Souvenir[] { return this.souvenirs; }
  getVoteDetails(): VoteDetail[] { return this.voteDetails; }
  
  hasVoted(): boolean { 
    return false; 
  }

  startPolling() {
    if (this.unsubs.length > 0) return;

    const settingsRef = ref(db, 'settings');
    const unsubSettings = onValue(settingsRef, (snapshot) => {
      const settings = snapshot.val() || {};
      this.isGlobalTestMode = settings.isGlobalTestMode || false;
      this.isVotingOpen = settings.isVotingOpen !== false; 
      this.useStaffVerification = settings.useStaffVerification !== false;
      this.logoUrl = settings.logoUrl || "";
      this.bgUrl = settings.bgUrl || "";
      this.notifyListeners();
    });
    this.unsubs.push(unsubSettings);

    const statsRef = ref(db, 'stats');
    const unsubStats = onValue(statsRef, (snapshot) => {
      const stats = snapshot.val() || {};
      this.masterKeyCount = stats.masterKeyCount || 0;
      this.authorizedStaffCount = stats.authorizedStaffCount || 0;
      this.notifyListeners();
    });
    this.unsubs.push(unsubStats);

    const candidatesRef = ref(db, 'candidates');
    const unsubCandidates = onValue(candidatesRef, (snapshot) => {
      const remoteCandidates = snapshot.val() || {};
      this.candidates = Object.keys(remoteCandidates).map((id, index) => {
        const c = remoteCandidates[id];
        let sSinging = c.scoreSinging || 0;
        let sPopularity = c.scorePopularity || 0;
        let sCostume = c.scoreCostume || 0;
        let vCount = c.voteCount || 0;

        return {
          id: id,
          name: c.name || 'Unknown',
          song: c.song || '',
          image: c.image || '',
          videoLink: c.videoLink || '',
          scoreSinging: sSinging,
          scorePopularity: sPopularity,
          scoreCostume: sCostume,
          totalScore: sSinging + sPopularity + sCostume,
          voteCount: vCount,
          color: COLORS[index % COLORS.length]
        };
      });
      this.notifyListeners();
    });
    this.unsubs.push(unsubCandidates);

    const souvenirsRef = ref(db, 'souvenirs');
    const unsubSouvenirs = onValue(souvenirsRef, (snapshot) => {
      const data = snapshot.val() || {};
      this.souvenirs = Object.keys(data).map(id => ({
        id: id,
        name: data[id].name || 'Unknown',
        quantity: typeof data[id].quantity === 'number' ? data[id].quantity : 0,
        image: data[id].image || ''
      }));
      this.notifyListeners();
    });
    this.unsubs.push(unsubSouvenirs);

    const voteDetailsRef = ref(db, 'vote_details');
    const unsubVoteDetails = onValue(voteDetailsRef, (snapshot) => {
      const data = snapshot.val() || {};
      this.voteDetails = Object.keys(data).map(id => ({
        id: id,
        staffId: data[id].staffId || '',
        name: data[id].name || '',
        singing: data[id].singing || '',
        popularity: data[id].popularity || '',
        costume: data[id].costume || '',
        souvenirId: data[id].souvenirId || '',
        souvenirName: data[id].souvenirName || '',
        ip: data[id].ip || 'Unknown',
        timestamp: data[id].timestamp || 0
      })).sort((a, b) => b.timestamp - a.timestamp);
      this.notifyListeners();
    });
    this.unsubs.push(unsubVoteDetails);

    const staffListRef = ref(db, 'staff_list');
    const unsubStaffList = onValue(staffListRef, (snapshot) => {
      const data = snapshot.val() || {};
      this.staffRoster = Object.keys(data).map(id => ({
        id: id,
        name: data[id].name || '',
        used: !!data[id].used
      })).sort((a, b) => a.id.localeCompare(b.id));
      this.notifyListeners();
    });
    this.unsubs.push(unsubStaffList);
  }

  stopPolling() {
    this.unsubs.forEach(unsub => unsub());
    this.unsubs = [];
  }

  async setVotingStatus(open: boolean) {
    await update(ref(db, 'settings'), { isVotingOpen: open });
  }

  async setGlobalTestMode(test: boolean) {
    await update(ref(db, 'settings'), { isGlobalTestMode: test });
  }

  async setStaffVerification(enabled: boolean) {
    await update(ref(db, 'settings'), { useStaffVerification: enabled });
  }

  async saveVisualSettings(logoUrl: string, bgUrl: string): Promise<{ success: boolean; message: string }> {
    try {
      await update(ref(db, 'settings'), { logoUrl, bgUrl });
      return { success: true, message: "視覺設定儲存成功！" };
    } catch (e: any) {
      return { success: false, message: `設定失敗: ${e.message}` };
    }
  }

  async uploadStaffIds(csvText: string): Promise<{ success: boolean; message: string }> {
    try {
      const lines = csvText.split(/\r?\n/);
      const updates: any = {};
      let count = 0;
      
      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;
        
        let id = trimmed;
        let name = "";
        
        const commaIndex = trimmed.indexOf(',') !== -1 ? trimmed.indexOf(',') : trimmed.indexOf('，');
        if (commaIndex !== -1) {
          id = trimmed.substring(0, commaIndex).trim();
          name = trimmed.substring(commaIndex + 1).trim();
        }
        
        id = id.toUpperCase();
        if (id.length > 0) {
          updates[`staff_list/${id}`] = { used: false, name: name };
          count++;
        }
      });

      if (count === 0) return { success: false, message: "未偵測到有效的工號。" };

      await update(ref(db), updates);
      await update(ref(db, 'stats'), { authorizedStaffCount: count });
      await update(ref(db, 'settings'), { useStaffVerification: true });
      return { success: true, message: `成功上傳 ${count} 組工號名單！` };
    } catch (e: any) {
      return { success: false, message: `上傳失敗: ${e.message}` };
    }
  }

  async lookupStaff(staffId: string): Promise<{ success: boolean; name?: string; used?: boolean }> {
    try {
      const id = staffId.trim().toUpperCase();
      if (!id) return { success: false };
      const staffRef = ref(db, `staff_list/${id}`);
      const snap = await get(staffRef);
      if (snap.exists()) {
        const val = snap.val();
        return { success: true, name: val.name || "", used: !!val.used };
      }
      return { success: false };
    } catch {
      return { success: false };
    }
  }

  async purgeStaffVerification(): Promise<{ success: boolean; message: string }> {
    try {
      const updates: any = {};
      updates['staff_list'] = null;
      updates['stats/masterKeyCount'] = 0;
      updates['stats/authorizedStaffCount'] = 0;
      updates['settings/useStaffVerification'] = false;
      await update(ref(db), updates);
      return { success: true, message: "工號名單已徹底清空，系統回復為開放投票模式。" };
    } catch (e: any) {
      return { success: false, message: `操作失敗: ${e.message}` };
    }
  }

  async resetStaffVotingStatus() {
    const snapshot = await get(ref(db, 'staff_list'));
    if (snapshot.exists()) {
      const data = snapshot.val();
      const updates: any = {};
      Object.keys(data).forEach(id => {
        updates[`staff_list/${id}/used`] = false;
      });
      updates['stats/masterKeyCount'] = 0;
      await update(ref(db), updates);
      return { success: true, message: "工號投票狀態已重置。" };
    }
    return { success: false, message: "無工號資料可重置。" };
  }

  async submitVoteBatch(
    votes: { [key in VoteCategory]: string }, 
    rawStaffId: string, 
    voterName: string,
    souvenirId: string,
    souvenirName: string,
    clientIp: string = "Unknown"
  ): Promise<{ success: boolean; message?: string }> {
    if (!this.isVotingOpen) return { success: false, message: "投票通道已關閉。" };
    
    const staffId = rawStaffId.trim().toUpperCase();
    const needsVerification = this.useStaffVerification;
    const isMasterKey = staffId === "16888";
    
    if (needsVerification && !isMasterKey) {
        if (!staffId) {
            return { success: false, message: "請輸入工號。" };
        }

        const staffRef = ref(db, `staff_list/${staffId}`);
        const staffSnap = await get(staffRef);
        
        if (!staffSnap.exists()) {
            return { success: false, message: "查無此工號，請確認後再試。" };
        }
        
        if (staffSnap.val().used === true && !this.isGlobalTestMode) {
            return { success: false, message: "此工號已參與過投票。" };
        }
    }

    try {
      // Check souvenir stock
      const souvenirRef = ref(db, `souvenirs/${souvenirId}`);
      const souvenirSnap = await get(souvenirRef);
      if (souvenirSnap.exists()) {
        const qty = souvenirSnap.val().quantity || 0;
        if (qty <= 0) {
          return { success: false, message: `紀念品 「${souvenirName}」 已發放完畢，請選擇其他款式。` };
        }
      } else {
        return { success: false, message: "選擇的紀念品型號不存在！" };
      }

      const updates: any = {};
      const voteId = this.generateRandomId(20);
      
      updates[`vote_details/${voteId}`] = {
        staffId: needsVerification ? staffId : "anonymous",
        name: voterName || "未備註",
        singing: votes[VoteCategory.SINGING],
        popularity: votes[VoteCategory.POPULARITY],
        costume: votes[VoteCategory.COSTUME],
        souvenirId: souvenirId,
        souvenirName: souvenirName,
        ip: clientIp,
        timestamp: Date.now()
      };
      
      if (isMasterKey) {
          updates['stats/masterKeyCount'] = increment(1);
      } else if (needsVerification) {
          updates[`staff_list/${staffId}/used`] = true;
          updates[`staff_list/${staffId}/name`] = voterName;
      }

      // Decrement souvenir quantity
      updates[`souvenirs/${souvenirId}/quantity`] = increment(-1);

      // Add vote ticks
      const categories = [VoteCategory.SINGING, VoteCategory.POPULARITY, VoteCategory.COSTUME];
      categories.forEach((cat) => {
        const candidateId = votes[cat];
        if (!candidateId) return;
        
        let field = "";
        if (cat === VoteCategory.SINGING) field = "scoreSinging";
        else if (cat === VoteCategory.POPULARITY) field = "scorePopularity";
        else if (cat === VoteCategory.COSTUME) field = "scoreCostume";

        updates[`candidates/${candidateId}/${field}`] = increment(1);
        updates[`candidates/${candidateId}/voteCount`] = increment(1);
      });

      await update(ref(db), updates);
      
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async testConnection(): Promise<{ message: string }> {
    try {
      await get(ref(db, 'settings'));
      return { message: "連線成功！Firebase 實時資料庫運作正常。" };
    } catch (e: any) {
      return { message: `連線失敗: ${e.message}` };
    }
  }

  clearMyHistory() {
    this.notifyListeners();
  }

  async resetAllRemoteVotes() {
    const updates: any = {};

    // Reset candidates scores
    const snapshot = await get(ref(db, 'candidates'));
    if (snapshot.exists()) {
      const data = snapshot.val();
      Object.keys(data).forEach(id => {
        updates[`candidates/${id}/scoreSinging`] = 0;
        updates[`candidates/${id}/scorePopularity`] = 0;
        updates[`candidates/${id}/scoreCostume`] = 0;
        updates[`candidates/${id}/voteCount`] = 0;
      });
    }

    // Clear votes, logs, stats
    updates['vote_details'] = null;
    updates['stats/masterKeyCount'] = 0;
    
    // Reset souvenirs quantities to default demo counts
    updates['souvenirs/souvenir_1/quantity'] = 150;
    updates['souvenirs/souvenir_2/quantity'] = 100;
    updates['souvenirs/souvenir_3/quantity'] = 50;

    // Reset all staff members' used status to false (preserves names!)
    const staffSnapshot = await get(ref(db, 'staff_list'));
    if (staffSnapshot.exists()) {
      const staffData = staffSnapshot.val();
      Object.keys(staffData).forEach(id => {
        updates[`staff_list/${id}/used`] = false;
      });
    }

    await update(ref(db), updates);
  }

  // --- Products CRUD (candidates) ---
  async saveProduct(id: string, name: string, category: string, image: string): Promise<{ success: boolean; message: string }> {
    try {
      const candidateRef = ref(db, `candidates/${id}`);
      await update(candidateRef, {
        name,
        song: category,
        image: image || "https://images.unsplash.com/photo-1516280440614-6697288d5d38?auto=format&fit=crop&w=800&q=80"
      });
      return { success: true, message: "產品儲存成功！" };
    } catch (e: any) {
      return { success: false, message: `產品儲存失敗: ${e.message}` };
    }
  }

  async addProduct(name: string, category: string, image: string): Promise<{ success: boolean; message: string }> {
    try {
      const id = 'prod_' + Date.now();
      const candidateRef = ref(db, `candidates/${id}`);
      await set(candidateRef, {
        name,
        song: category,
        image: image || "https://images.unsplash.com/photo-1516280440614-6697288d5d38?auto=format&fit=crop&w=800&q=80",
        scoreSinging: 0,
        scorePopularity: 0,
        scoreCostume: 0,
        voteCount: 0
      });
      return { success: true, message: "產品新增成功！" };
    } catch (e: any) {
      return { success: false, message: `產品新增失敗: ${e.message}` };
    }
  }

  async deleteCandidate(id: string) {
    await remove(ref(db, `candidates/${id}`));
  }

  // --- Souvenirs CRUD ---
  async saveSouvenir(id: string, name: string, quantity: number, image: string): Promise<{ success: boolean; message: string }> {
    try {
      await update(ref(db, `souvenirs/${id}`), {
        name,
        quantity: Number(quantity),
        image: image || ""
      });
      return { success: true, message: "紀念品設定成功！" };
    } catch (e: any) {
      return { success: false, message: `紀念品設定失敗: ${e.message}` };
    }
  }

  async addSouvenir(name: string, quantity: number, image: string): Promise<{ success: boolean; message: string }> {
    try {
      const id = 'souv_' + Date.now();
      await set(ref(db, `souvenirs/${id}`), {
        name,
        quantity: Number(quantity),
        image: image || ""
      });
      return { success: true, message: "紀念品新增成功！" };
    } catch (e: any) {
      return { success: false, message: `紀念品新增失敗: ${e.message}` };
    }
  }

  async deleteSouvenir(id: string): Promise<{ success: boolean; message: string }> {
    try {
      await remove(ref(db, `souvenirs/${id}`));
      return { success: true, message: "紀念品已成功刪除！" };
    } catch (e: any) {
      return { success: false, message: `紀念品刪除失敗: ${e.message}` };
    }
  }
}

export const voteService = new VoteService();
