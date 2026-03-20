import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = 3000;

// Secret key for JWT signing
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_for_meyers_entrepreneur';

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Mock Database Fallback (in-memory array)
// Includes a hardcoded mock "admin" user for immediate testing if Supabase is not configured
const mockUsers: any[] = [
  {
    id: '1',
    username: 'admin',
    passwordHash: bcrypt.hashSync('admin123', 10),
    role: 'admin',
    batch_id: 'ADMIN_BATCH'
  },
  {
    id: '2',
    username: 'jm',
    passwordHash: bcrypt.hashSync('jm', 10),
    role: 'admin',
    batch_id: 'ADMIN_BATCH'
  }
];
let nextUserId = 4;

const mockBatches: any[] = [
  { id: '1', name: 'Batch 1', created_at: new Date().toISOString() }
];
let nextBatchId = 2;

// Middleware
app.use(express.json());
app.use(cookieParser());

// --- Authentication Middleware ---

// 3. Protected Routes (Middleware): authenticateToken
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  // Check the HttpOnly cookie for a valid, unexpired JWT
  const token = req.cookies.token;
  console.log('authenticateToken: Token from cookie:', token ? 'Exists' : 'Missing');

  if (!token) {
    // Redirect to login if token is missing
    console.error('authenticateToken: No token provided');
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      // If the 4-hour window has passed, the JWT will be invalid
      console.error('authenticateToken: JWT verification error:', err.message);
      return res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
    }
    // Attach decoded user info to request
    console.log('authenticateToken: Decoded user:', decoded);
    (req as any).user = decoded;
    next();
  });
};

// 3. Protected Routes (Middleware): requireAdmin
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  // Check the decoded JWT role. Deny access if the role is "trainee"
  if (user && user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
};

// --- Admin Batches API ---
app.get('/api/admin/batches', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    if (supabase) {
      const { data, error } = await supabase.from('batches').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json({ batches: data });
    } else {
      res.json({ batches: mockBatches });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/batches', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, start_date } = req.body;
    if (!name) return res.status(400).json({ error: 'Batch name is required' });

    if (supabase) {
      const { data, error } = await supabase.from('batches').insert([{ name, start_date }]).select().single();
      if (error) throw error;
      res.json({ batch: data });
    } else {
      const newBatch = { id: String(nextBatchId++), name, start_date, created_at: new Date().toISOString() };
      mockBatches.push(newBatch);
      res.json({ batch: newBatch });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/batches/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, start_date } = req.body;
    if (supabase) {
      const { data, error } = await supabase.from('batches').update({ name, start_date }).eq('id', id).select().single();
      if (error) throw error;
      res.json({ batch: data });
    } else {
      const idx = mockBatches.findIndex(b => b.id === id);
      if (idx !== -1) {
        mockBatches[idx] = { ...mockBatches[idx], name, start_date };
        res.json({ batch: mockBatches[idx] });
      } else {
        res.status(404).json({ error: 'Batch not found' });
      }
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- API Routes ---

// 0. Validate Registration Code
// 0. Validate Registration Code
app.get('/api/debug/profiles', async (req: Request, res: Response) => {
  try {
    if (supabase) {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      res.json(data);
    } else {
      res.json({ message: 'Supabase not configured' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/debug/codes', async (req: Request, res: Response) => {
  try {
    if (supabase) {
      const { data, error } = await supabase.from('generation_codes').select('*');
      if (error) throw error;
      res.json(data);
    } else {
      res.json({ message: 'Supabase not configured' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/validate-code', async (req: Request, res: Response) => {
  console.log('Validating code:', req.body.code);
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Code is required' });

    if (supabase) {
      console.log('Supabase is configured, querying generation_codes...');
      const { data, error } = await supabase
        .from('generation_codes')
        .select('*')
        .eq('code', code)
        .eq('is_used', false)
        .single();
      
      if (error) {
        console.error('Supabase error validating code:', error);
        return res.status(400).json({ error: 'Invalid or already used registration code' });
      }

      if (!data) {
        console.log('No data found for code:', code);
        return res.status(400).json({ error: 'Invalid or already used registration code' });
      }

      console.log('Code is valid:', data);
      res.json({ valid: true });
    } else {
      console.log('Supabase NOT configured, using mock validation');
      // Mock check (for simplicity, any code is valid in mock mode if not already used)
      res.json({ valid: true });
    }
  } catch (error: any) {
    console.error('Catch block error validating code:', error);
    res.status(500).json({ error: error.message });
  }
});

// 1. Secure User Registration (/api/signup)
app.post('/api/signup', async (req: Request, res: Response) => {
  try {
    const { 
      registrationCode, username, email, password, 
      profile, academicBackground, workBackground, amazonVaExperience 
    } = req.body;

    if (!registrationCode || !username || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let batchId = 'DEFAULT_BATCH';
    let codeData: any = null;

    if (supabase) {
      // 1. Verify registration code
      const { data: codeData, error: codeError } = await supabase
        .from('generation_codes')
        .select('*')
        .eq('code', registrationCode)
        .eq('is_used', false)
        .single();

      if (codeError || !codeData) {
        console.error('Invalid or used registration code:', registrationCode);
        return res.status(400).json({ error: 'Invalid or already used registration code' });
      }

      // 2. Safely mark the code as used FIRST to prevent race conditions
      const { data: updateData, error: updateError } = await supabase
        .from('generation_codes')
        .update({ is_used: true })
        .eq('id', codeData.id)
        .eq('is_used', false)
        .select()
        .single();

      if (updateError || !updateData) {
        console.error('Error claiming code (possible race condition):', updateError);
        return res.status(400).json({ error: 'Code was just used by someone else or is invalid.' });
      }

      // 3. Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: profile?.fullName,
            username: username
          }
        }
      });

      if (authError) {
        console.error('Supabase Auth Signup error:', authError.message);
        return res.status(400).json({ error: authError.message });
      }

      if (!authData.user) {
        console.error('Supabase Auth Signup failed: No user returned');
        // Rollback code
        await supabase.from('generation_codes').update({ is_used: false }).eq('id', codeData.id);
        return res.status(400).json({ error: 'Signup failed' });
      }

      // 4. Create profile linked to auth user
      const passwordHash = await bcrypt.hash(password, 10);
      const fullNameStr = profile?.fullName ? `${profile.fullName.first} ${profile.fullName.mi ? profile.fullName.mi + ' ' : ''}${profile.fullName.last}` : username;
      const newUser = {
        id: authData.user.id, // Link to Supabase Auth ID
        username,
        email_address: email,
        password_hash: passwordHash,
        role: 'trainee',
        batch_id: codeData.batch_id,
        generation_code_id: codeData.id,
        full_name: fullNameStr,
        age: profile?.age,
        birthday: profile?.birthday,
        address: profile?.address,
        contact_number: profile?.contactNumber,
        academic_background: academicBackground,
        work_background: workBackground,
        amazon_va_experience: amazonVaExperience
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([newUser]);

      if (profileError) {
        console.error('Profile creation error:', profileError.message);
        // Clean up code usage if profile fails
        await supabase.from('generation_codes').update({ is_used: false }).eq('id', codeData.id);
        return res.status(400).json({ error: 'Could not create user profile: ' + profileError.message });
      }

      // 5. Link code to user
      const { error: finalUpdateError } = await supabase
        .from('generation_codes')
        .update({ used_by: authData.user.id })
        .eq('id', codeData.id);

      if (finalUpdateError) {
        console.error('Error linking code to user ID:', JSON.stringify(finalUpdateError));
      }

      console.log('Signup successful for:', username);
      return res.status(201).json({ message: 'User registered successfully' });
    } else {
      // Mock DB Check
      if (mockUsers.find(u => u.username === username || u.email_address === email)) {
        return res.status(409).json({ error: 'Username or email already exists' });
      }

      // Mock DB Insert
      const passwordHash = await bcrypt.hash(password, 10);
      mockUsers.push({
        id: String(nextUserId++),
        username,
        email_address: email,
        password_hash: passwordHash,
        role: 'trainee',
        batch_id: 'mock-batch',
        passwordHash: passwordHash // map for mock
      });
      return res.status(201).json({ message: 'User registered successfully (Mock)' });
    }
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 2. Secure Login with 4-Hour Session (/api/login)
app.post('/api/login', async (req: Request, res: Response) => {
  try {
    const { username, password, requiredRole } = req.body;
    console.log('Login attempt for user:', username, 'Required Role:', requiredRole);

    let user;
    if (supabase) {
      // 1. Fetch the profile by username
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();
      
      if (profileError || !profile) {
        console.log('Profile not found in Supabase for:', username, '- Checking mockUsers...');
        const mockUser = mockUsers.find(u => u.username === username);
        if (mockUser && await bcrypt.compare(password, mockUser.passwordHash)) {
          user = { ...mockUser };
        } else {
          return res.status(401).json({ error: 'Invalid username or password' });
        }
      } else {
        // 2. Attempt Supabase Auth or Fallback to manual bcrypt
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: profile.email_address,
          password: password,
        });

        if (authError) {
          console.log('Supabase Auth failed, trying manual bcrypt fallback for:', username);
          const passwordMatch = await bcrypt.compare(password, profile.password_hash);
          if (passwordMatch) {
            user = { ...profile };
          } else {
            // Check mockUsers as last resort
            const mockUser = mockUsers.find(u => u.username === username);
            if (mockUser && await bcrypt.compare(password, mockUser.passwordHash)) {
              user = { ...mockUser };
            } else {
              return res.status(401).json({ error: 'Invalid username or password' });
            }
          }
        } else {
          user = { ...profile };
        }
      }
    } else {
      const mockUser = mockUsers.find(u => u.username === username);
      if (mockUser && await bcrypt.compare(password, mockUser.passwordHash)) {
        user = { ...mockUser };
      } else {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
    }

    // Role validation
    if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
      return res.status(401).json({ error: 'Unauthorized role for this portal' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, batch_id: user.batch_id },
      JWT_SECRET,
      { expiresIn: '4h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 4 * 60 * 60 * 1000,
      path: '/'
    });

    res.json({ message: 'Login successful', role: user.role });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. Logout Functionality (/api/logout)
app.post('/api/logout', (req: Request, res: Response) => {
  // Clear the JWT cookie instantly
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

// Protected Route Example: User Profile
app.get('/api/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userFromToken = (req as any).user;
    
    if (supabase) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userFromToken.id)
        .single();
      
      if (error) throw error;
      res.json({ user: profile });
    } else {
      const mockUser = mockUsers.find(u => u.id === userFromToken.id);
      res.json({ user: mockUser });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Protected Route Example: Admin Data
app.get('/api/admin-data', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  if (supabase) {
    const { data, error } = await supabase.from('profiles').select('id, username, role');
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Secret admin data', users: data });
  } else {
    res.json({ message: 'Secret admin data', users: mockUsers.map(u => ({ id: u.id, username: u.username, role: u.role })) });
  }
});

// --- Admin Trainees API ---
app.get('/api/admin/trainees/:batch_id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { batch_id } = req.params;
    if (supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, generation_codes(code)')
        .eq('batch_id', batch_id)
        .eq('role', 'trainee')
        .order('username', { ascending: true });
      
      if (error) throw error;
      
      // Flatten the registration code
      const trainees = data.map((t: any) => ({
        ...t,
        registration_code: t.generation_codes?.code || 'N/A'
      }));
      
      res.json({ trainees });
    } else {
      const trainees = mockUsers.filter(u => u.batch_id === batch_id && u.role === 'trainee');
      res.json({ trainees });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Sourcing Sheet API ---
app.post('/api/leads', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const leadData = req.body;

    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured. Cannot save lead.' });
    }

    // Check if product already submitted in the past month by anyone in the same batch
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const { data: existingLeads, error: checkError } = await supabase
      .from('sourcing_leads')
      .select('id, profiles!inner(batch_id)')
      .eq('profiles.batch_id', user.batch_id)
      .eq('amazon_asin', leadData.amazon_asin)
      .gte('created_at', oneMonthAgo.toISOString());

    if (checkError) throw checkError;

    if (existingLeads && existingLeads.length > 0) {
      return res.status(409).json({ error: 'This product (ASIN) has already been submitted by your batch in the past month.' });
    }

    const newLead = {
      user_id: user.id,
      product_name: leadData.product_name,
      amazon_asin: leadData.amazon_asin,
      amazon_link: leadData.amazon_url,
      source_link: leadData.supplier_url,
      screenshot_url: leadData.screenshot_url,
      cost_price: leadData.cost_price,
      sale_price: leadData.sale_price,
      profit: leadData.profit,
      roi: leadData.roi,
      bsr: leadData.bsr,
      sales_per_month: leadData.sales_per_month,
      is_hazmat: leadData.is_hazmat || false,
      is_fragile: leadData.is_fragile || false,
      trainee_comment: leadData.trainee_comment,
      lead_remark: 'Pending'
    };

    const { data, error } = await supabase
      .from('sourcing_leads')
      .insert([newLead])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Lead added successfully', lead: data });
  } catch (error: any) {
    console.error('Add lead error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.get('/api/leads', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    if (!supabase) {
      return res.json({ leads: [] });
    }

    // Try with join first
    let { data, error } = await supabase
      .from('sourcing_leads')
      .select('*, profiles!inner(batch_id)')
      .eq('profiles.batch_id', user.batch_id)
      .order('created_at', { ascending: false });

    // Fallback if join fails
    if (error && error.code === 'PGRST200') {
      console.log('Get leads join failed, using fallback');
      
      // Get all leads
      const { data: allLeads, error: leadsError } = await supabase
        .from('sourcing_leads')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (leadsError) throw leadsError;

      // Filter leads by batch_id by checking corresponding profiles
      const userIds = [...new Set(allLeads.map((l: any) => l.user_id).filter(Boolean))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, batch_id')
        .in('id', userIds)
        .eq('batch_id', user.batch_id);
      
      if (profilesError) throw profilesError;

      const validUserIds = new Set(profiles.map((p: any) => p.id));
      data = allLeads.filter((l: any) => validUserIds.has(l.user_id));
    } else if (error) {
      throw error;
    }

    res.json({ leads: data });
  } catch (error: any) {
    console.error('Get leads error:', JSON.stringify(error));
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// --- Chat API ---
app.get('/api/chat/:channel', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { channel } = req.params; // 'general' or 'admin'
    const user = (req as any).user;

    // Calculate the date 3 days ago
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const threeDaysAgoStr = threeDaysAgo.toISOString();

    if (!supabase) {
      return res.json({ messages: [] });
    }

    let query = supabase
      .from('chat_messages')
      .select('*, sender:profiles!sender_id(username, role, full_name)')
      .gte('created_at', threeDaysAgoStr)
      .order('created_at', { ascending: true });

    if (channel === 'general') {
      const batchId = req.query.batch_id || user.batch_id;
      if (batchId === 'all') {
        // For admins viewing all batches or messages sent to all batches
        query = query.eq('channel', 'general');
      } else {
        // Messages for a specific batch OR messages sent to all batches (null batch_id)
        query = query.eq('channel', 'general').or(`batch_id.eq.${batchId},batch_id.is.null`);
      }
    } else if (channel === 'admin') {
      const traineeId = req.query.trainee_id;
      if (user.role === 'admin' && traineeId) {
        query = query.eq('channel', 'admin').or(`and(sender_id.eq.${user.id},receiver_id.eq.${traineeId}),and(sender_id.eq.${traineeId},receiver_id.eq.${user.id})`);
      } else {
        query = query.eq('channel', 'admin').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ messages: data });
  } catch (error: any) {
    console.error('Get chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/chat/:channel', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { channel } = req.params;
    const { message, receiver_id, batch_id } = req.body;
    const user = (req as any).user;

    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    let finalReceiverId = receiver_id;
    if (channel === 'admin' && user.role !== 'admin') {
      // Find an admin to receive the message
      const { data: adminData } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1)
        .single();
      
      if (adminData) {
        finalReceiverId = adminData.id;
      }
    }

    // Clean up batch_id for admin talking to trainee in admin channel. It should be null,
    // as it's a direct message and not associated to the admin's batch_id.
    const finalBatchId = channel === 'general'
      ? (batch_id === 'all' ? null : (batch_id || user.batch_id || null))
      : null;

    const newMessage = {
      sender_id: user.id,
      channel,
      message,
      batch_id: finalBatchId,
      receiver_id: channel === 'admin' ? finalReceiverId : null
    };

    const { data, error } = await supabase
      .from('chat_messages')
      .insert([newMessage])
      .select('*, sender:profiles!sender_id(username, role, full_name)')
      .single();

    if (error) throw error;

    res.status(201).json({ message: data });
  } catch (error: any) {
    console.error('Send chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/chat/report', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { message_id, reason } = req.body;
    const user = (req as any).user;

    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { error } = await supabase
      .from('chat_reports')
      .insert([{
        reporter_id: user.id,
        message_id,
        reason
      }]);

    if (error) throw error;

    res.status(201).json({ message: 'Report submitted successfully' });
  } catch (error: any) {
    console.error('Report chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- Meetings API ---
app.get('/api/meetings', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!supabase) {
      return res.json({ meetings: [] });
    }

    // Try with join first
    let { data, error } = await supabase
      .from('meetings')
      .select(`
        *,
        meeting_participants!inner(user_id)
      `)
      .eq('meeting_participants.user_id', user.id)
      .order('meeting_time', { ascending: true });

    // Fallback if join fails
    if (error && error.code === 'PGRST200') {
      console.log('Get meetings join failed, using fallback');
      
      // Get all meeting IDs where user is a participant
      const { data: participations, error: partError } = await supabase
        .from('meeting_participants')
        .select('meeting_id')
        .eq('user_id', user.id);
      
      if (partError) throw partError;

      const meetingIds = participations.map((p: any) => p.meeting_id);
      
      if (meetingIds.length === 0) {
        data = [];
      } else {
        const { data: meetings, error: meetingsError } = await supabase
          .from('meetings')
          .select('*')
          .in('id', meetingIds)
          .order('meeting_time', { ascending: true });
        
        if (meetingsError) throw meetingsError;
        data = meetings;
      }
    } else if (error) {
      throw error;
    }

    res.json({ meetings: data });
  } catch (error: any) {
    console.error('Get meetings error:', JSON.stringify(error));
    res.status(500).json({ error: error.message });
  }
});

// --- Admin Leads API ---
app.get('/api/admin/leads', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { batch_id } = req.query;

    if (!supabase) {
      // Mock data for leads
      let mockLeads = [
        {
          id: '1',
          trainee_id: '2',
          user: { username: 'trainee1', full_name: 'John Doe', batch_id: 'ADMIN_BATCH' },
          lead_remark: 'Pending',
          admin_comment: '',
          created_at: new Date().toISOString(),
          product_name: 'Example Product',
          amazon_asin: 'B00EXAMPLE',
          cost_price: 10,
          sale_price: 25,
          profit: 10,
          roi: 100
        }
      ];

      if (batch_id) {
        mockLeads = mockLeads.filter(l => l.user.batch_id === batch_id);
      }
      return res.json({ leads: mockLeads });
    }

    // Try selecting without the hint first, or use the explicit relationship name
    // In Supabase, if there's only one FK, profiles(...) should work.
    let query = supabase
      .from('sourcing_leads')
      .select('*, profiles!user_id(username, full_name, batch_id)')
      .order('created_at', { ascending: false });

    if (batch_id && batch_id !== 'all') {
      query = query.eq('batch_id', batch_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Get admin leads error:', JSON.stringify(error));
      // Fallback: fetch without join if join fails
      const { data: simpleData, error: simpleError } = await supabase
        .from('sourcing_leads')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (simpleError) throw simpleError;

      // Manually fetch profiles
      const userIds = [...new Set(simpleData.map(l => l.user_id).filter(Boolean))];
      const { data: profiles } = await supabase.from('profiles').select('id, username, full_name, batch_id').in('id', userIds);
      
      const enrichedLeads = simpleData.map(lead => ({
        ...lead,
        user: profiles?.find(p => p.id === lead.user_id) || null
      }));

      return res.json({ leads: enrichedLeads });
    }

    // Map profiles to user for consistency
    const enrichedData = data.map((lead: any) => ({
      ...lead,
      user: lead.profiles
    }));

    res.json({ leads: enrichedData });
  } catch (error: any) {
    console.error('Get admin leads catch block:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/leads/:id/remark', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { remark, comment } = req.body;

    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { error } = await supabase
      .from('sourcing_leads')
      .update({ 
        lead_remark: remark,
        admin_comment: comment
      })
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Lead updated successfully' });
  } catch (error: any) {
    console.error('Update lead error:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- Admin Meetings API ---
app.get('/api/admin/meetings', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!supabase) {
      return res.json({ meetings: [] });
    }

    // Try with join first
    let { data, error } = await supabase
      .from('meetings')
      .select('*, meeting_participants(user_id)')
      .order('meeting_time', { ascending: true });

    // Fallback if join fails
    if (error && error.code === 'PGRST200') {
      console.log('Get admin meetings join failed, using fallback');
      
      const { data: meetings, error: meetingsError } = await supabase
        .from('meetings')
        .select('*')
        .order('meeting_time', { ascending: true });
      
      if (meetingsError) throw meetingsError;

      const meetingIds = meetings.map((m: any) => m.id);
      const { data: participants, error: participantsError } = await supabase
        .from('meeting_participants')
        .select('meeting_id, user_id')
        .in('meeting_id', meetingIds);
      
      if (participantsError) throw participantsError;

      data = meetings.map((m: any) => ({
        ...m,
        meeting_participants: participants.filter((p: any) => p.meeting_id === m.id)
      }));
    } else if (error) {
      throw error;
    }

    res.json({ meetings: data });
  } catch (error: any) {
    console.error('Get admin meetings error:', JSON.stringify(error));
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/meetings', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { subject, meeting_time, meeting_link, recipient_type, selected_users, batch_id } = req.body;
    const user = (req as any).user;

    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .insert([{
        batch_id: recipient_type === 'group' ? batch_id : null,
        subject,
        meeting_time,
        meeting_link,
        meeting_type: recipient_type,
        created_by: user.id,
        is_all: recipient_type === 'group'
      }])
      .select()
      .single();

    if (meetingError) throw meetingError;

    if (recipient_type === 'individual' && selected_users && selected_users.length > 0) {
      const participants = selected_users.map((userId: string) => ({
        meeting_id: meeting.id,
        user_id: userId
      }));
      const { error: partError } = await supabase.from('meeting_participants').insert(participants);
      if (partError) throw partError;
    } else if (recipient_type === 'group') {
      // Fetch all users in the batch and add them as participants
      const { data: batchUsers } = await supabase.from('profiles').select('id').eq('batch_id', batch_id);
      if (batchUsers) {
        const participants = batchUsers.map(u => ({
          meeting_id: meeting.id,
          user_id: u.id
        }));
        await supabase.from('meeting_participants').insert(participants);
      }
    }

    res.status(201).json({ message: 'Meeting created successfully', meeting });
  } catch (error: any) {
    console.error('Create meeting error:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- Daily Content API ---
app.get('/api/daily-content', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.cookies.userId;
    const user = (req as any).user;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    let { day } = req.query;
    if (!supabase) return res.json({ content: null });

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('batch_id')
      .eq('id', userId)
      .single();
    
    if (profileError) throw profileError;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // If day is not provided, find the day scheduled for today
    if (!day && profile.batch_id) {
      const { data: schedule, error: scheduleError } = await supabase
        .from('batch_schedules')
        .select('day_number')
        .eq('batch_id', profile.batch_id)
        .eq('scheduled_date', todayStr)
        .single();
      
      if (!scheduleError && schedule) {
        day = String(schedule.day_number);
      } else {
        // Fallback to old logic if no schedule found
        const { data: batch, error: batchError } = await supabase
          .from('batches')
          .select('start_date')
          .eq('id', profile.batch_id)
          .single();
        
        if (!batchError && batch && batch.start_date) {
          const startDate = new Date(batch.start_date);
          const diffTime = Math.abs(today.getTime() - startDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          day = String(diffDays);
        } else {
          day = '1';
        }
      }
    } else if (!day) {
      day = '1';
    }

    // Check availability if it's a trainee
    if (user.role === 'trainee' && profile.batch_id) {
      const { data: schedule, error: scheduleError } = await supabase
        .from('batch_schedules')
        .select('scheduled_date')
        .eq('batch_id', profile.batch_id)
        .eq('day_number', parseInt(day as string))
        .single();
      
      if (!scheduleError && schedule) {
        if (schedule.scheduled_date !== todayStr) {
          return res.json({ 
            content: null, 
            error: `Content for Day ${day} is only available on ${schedule.scheduled_date}.`,
            scheduled_date: schedule.scheduled_date
          });
        }
      }
    }

    // If it's Friday (day 5), check if there's a general test (day 100)
    if (day === '5') {
      const { data: testData } = await supabase
        .from('daily_content')
        .select('*')
        .eq('day_number', 100)
        .single();
      
      if (testData) {
        return res.json({ content: testData, current_day: day });
      }
    }

    const { data, error } = await supabase
      .from('daily_content')
      .select('*')
      .eq('day_number', day)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    res.json({ content: data || null, current_day: day });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/daily-content', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { day_number, videos, quiz_questions } = req.body;
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    const { data, error } = await supabase
      .from('daily_content')
      .upsert([{
        day_number,
        videos, // Array of { url, title, description, is_important }
        quiz_questions
      }], { onConflict: 'day_number' })
      .select()
      .single();

    if (error) throw error;
    res.json({ content: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Admin Chat Reports API ---
app.get('/api/admin/chat-reports', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!supabase) {
      return res.json({ reports: [] });
    }

    // Try with join first
    let { data, error } = await supabase
      .from('chat_reports')
      .select(`
        *,
        reporter:profiles!reporter_id(username),
        message:chat_messages!message_id(message, sender:profiles!sender_id(username))
      `)
      .order('created_at', { ascending: false });

    // Fallback if join fails
    if (error && error.code === 'PGRST200') {
      console.log('Get chat reports join failed, using fallback');
      
      const { data: reports, error: reportsError } = await supabase
        .from('chat_reports')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (reportsError) throw reportsError;

      // Fetch reporters
      const reporterIds = [...new Set(reports.map((r: any) => r.reporter_id).filter(Boolean))];
      const { data: reporters, error: reportersError } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', reporterIds);
      
      if (reportersError) throw reportersError;

      // Fetch messages
      const messageIds = [...new Set(reports.map((r: any) => r.message_id).filter(Boolean))];
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('id, message, sender_id')
        .in('id', messageIds);
      
      if (messagesError) throw messagesError;

      // Fetch senders for messages
      const senderIds = [...new Set(messages.map((m: any) => m.sender_id).filter(Boolean))];
      const { data: senders, error: sendersError } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', senderIds);
      
      if (sendersError) throw sendersError;

      data = reports.map((r: any) => {
        const reporter = reporters.find((p: any) => p.id === r.reporter_id);
        const message = messages.find((m: any) => m.id === r.message_id);
        let messageWithSender = null;
        if (message) {
          const sender = senders.find((p: any) => p.id === message.sender_id);
          messageWithSender = {
            ...message,
            sender: sender || null
          };
        }
        return {
          ...r,
          reporter: reporter || null,
          message: messageWithSender
        };
      });
    } else if (error) {
      throw error;
    }

    res.json({ reports: data });
  } catch (error: any) {
    console.error('Get chat reports error:', JSON.stringify(error));
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/videos', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!supabase) return res.json({ videos: [] });
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('day_number', { ascending: true })
      .order('sequence_order', { ascending: true });
    
    if (error) throw error;
    res.json({ videos: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/videos', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
    const { url, title, description, is_important, day_number, sequence_order } = req.body;
    
    const { data, error } = await supabase
      .from('videos')
      .insert([{ url, title, description, is_important, day_number, sequence_order }])
      .select()
      .single();
    
    if (error) throw error;
    res.json({ video: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/videos/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
    const { id } = req.params;
    
    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/videos/reorder', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
    const { videos } = req.body;
    
    // Update each video's sequence_order
    for (const v of videos) {
      await supabase
        .from('videos')
        .update({ sequence_order: v.sequence_order })
        .eq('id', v.id);
    }
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
app.get('/api/admin/trainees', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!supabase) return res.json({ trainees: [] });
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, batch_id')
      .eq('role', 'trainee')
      .order('username', { ascending: true });
    
    if (error) throw error;
    res.json({ trainees: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/chat-reports/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'dismiss' or 'delete_message'

    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    // Get the report to find the message ID
    const { data: report, error: reportError } = await supabase
      .from('chat_reports')
      .select('message_id')
      .eq('id', id)
      .single();

    if (reportError) throw reportError;

    if (action === 'delete_message') {
      // Delete the message
      const { error: deleteError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', report.message_id);
      
      if (deleteError) throw deleteError;
    }

    // Update report status
    const { error: updateError } = await supabase
      .from('chat_reports')
      .update({ status: 'resolved' })
      .eq('id', id);

    if (updateError) throw updateError;

    res.json({ message: 'Report resolved successfully' });
  } catch (error: any) {
    console.error('Resolve report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- Admin Codes API ---
const generateRandomString = (length: number) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

app.get('/api/admin/codes', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!supabase) {
      return res.json({ codes: [] });
    }

    const { data, error } = await supabase
      .from('generation_codes')
      .select('*, profiles!used_by(username)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get admin codes error:', JSON.stringify(error));
      
      // Fallback: fetch without join
      const { data: simpleData, error: simpleError } = await supabase
        .from('generation_codes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (simpleError) throw simpleError;

      const userIds = [...new Set(simpleData.filter(c => c.used_by).map(c => c.used_by))];
      const { data: profiles } = await supabase.from('profiles').select('id, username').in('id', userIds);

      const enrichedCodes = simpleData.map(code => ({
        ...code,
        user: profiles?.find(p => p.id === code.used_by) || null
      }));

      return res.json({ codes: enrichedCodes });
    }

    // Map profiles to user for consistency
    const enrichedData = data.map((code: any) => ({
      ...code,
      user: code.profiles
    }));

    res.json({ codes: enrichedData });
  } catch (error: any) {
    console.error('Get admin codes catch block:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/codes', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { batch_id } = req.body;

    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    if (!batch_id) {
      return res.status(400).json({ error: 'Batch ID is required' });
    }

    // Fetch batch details to construct the code
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select('name')
      .eq('id', batch_id)
      .single();

    if (batchError || !batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    // Format: batch# - year - random
    // Example Batch Name: "Batch 1 - 2026"
    // Resulting Code: "batch1-2026-73dYk"
    const match = batch.name.match(/Batch\s+(\d+)\s*-\s*(\d{4})/i);
    let codePrefix = 'batch';
    
    if (match) {
      const batchNum = match[1];
      const year = match[2];
      codePrefix = `batch${batchNum}-${year}`;
    } else {
      // Fallback for non-standard batch names
      codePrefix = batch.name.toLowerCase().replace(/\s+/g, '-');
    }

    const randomPart = generateRandomString(5);
    const finalCode = `${codePrefix}-${randomPart}`;

    const { data, error } = await supabase
      .from('generation_codes')
      .insert([{ code: finalCode, batch_id }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Code generated successfully', code: data });
  } catch (error: any) {
    console.error('Generate code error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/codes/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { error } = await supabase
      .from('generation_codes')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Code deleted successfully' });
  } catch (error: any) {
    console.error('Delete code error:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- Task Management API ---
app.get('/api/tasks', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!supabase) return res.json({ tasks: [] });

    const { data, error } = await supabase
      .from('tasks')
      .select('*, task_submissions!left(*)')
      .eq('batch_id', user.batch_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ tasks: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/tasks', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { batch_id, title, details, deadline, gdocs_link } = req.body;
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    const { data, error } = await supabase
      .from('tasks')
      .insert([{ batch_id, title, details, deadline, gdocs_link }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ task: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasks/:id/submit', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { gdocs_link } = req.body;
    const user = (req as any).user;

    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    const { data, error } = await supabase
      .from('task_submissions')
      .upsert([{
        task_id: id,
        trainee_id: user.id,
        gdocs_link,
        submitted_at: new Date().toISOString()
      }], { onConflict: 'task_id,trainee_id' })
      .select()
      .single();

    if (error) throw error;
    res.json({ submission: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/tasks/submissions', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { batch_id } = req.query;
    if (!supabase) return res.json({ submissions: [] });

    // Try with join first
    let { data, error } = await supabase
      .from('task_submissions')
      .select('*, task:tasks!inner(*), trainee:profiles!trainee_id(username, full_name)')
      .order('submitted_at', { ascending: false });

    // Fallback if join fails
    if (error && error.code === 'PGRST200') {
      console.log('Get task submissions join failed, using fallback');
      
      const { data: submissions, error: subError } = await supabase
        .from('task_submissions')
        .select('*')
        .order('submitted_at', { ascending: false });
      
      if (subError) throw subError;

      // Fetch tasks
      const taskIds = [...new Set(submissions.map((s: any) => s.task_id).filter(Boolean))];
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .in('id', taskIds);
      
      if (tasksError) throw tasksError;

      // Fetch trainees
      const traineeIds = [...new Set(submissions.map((s: any) => s.trainee_id).filter(Boolean))];
      const { data: trainees, error: traineesError } = await supabase
        .from('profiles')
        .select('id, username, full_name, batch_id')
        .in('id', traineeIds);
      
      if (traineesError) throw traineesError;

      data = submissions.map((s: any) => ({
        ...s,
        task: tasks.find((t: any) => t.id === s.task_id) || null,
        trainee: trainees.find((t: any) => t.id === s.trainee_id) || null
      }));

      // Filter by batch_id if provided
      if (batch_id && batch_id !== 'all') {
        data = data.filter((s: any) => s.task?.batch_id === batch_id);
      }
    } else if (error) {
      throw error;
    } else {
      // If join succeeded, we still might need to filter by batch_id if it wasn't handled by the inner join
      if (batch_id && batch_id !== 'all') {
        data = data.filter((s: any) => s.task?.batch_id === batch_id);
      }
    }

    res.json({ submissions: data });
  } catch (error: any) {
    console.error('Get task submissions error:', JSON.stringify(error));
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/tasks/submissions/:id/grade', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { grade, comment } = req.body;
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    const { data, error } = await supabase
      .from('task_submissions')
      .update({ grade, admin_comment: comment })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ submission: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- General Test API ---
app.post('/api/admin/generate-test', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { batch_id, scheduled_time } = req.body;
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    // Fetch 10 questions from each day (1-5)
    const { data: contents, error: contentError } = await supabase
      .from('daily_content')
      .select('day_number, quiz_questions')
      .in('day_number', [1, 2, 3, 4, 5]);

    if (contentError) throw contentError;

    let allQuestions: any[] = [];
    contents.forEach(day => {
      if (day.quiz_questions && Array.isArray(day.quiz_questions)) {
        // Shuffle and pick 10
        const shuffled = [...day.quiz_questions].sort(() => 0.5 - Math.random());
        allQuestions = [...allQuestions, ...shuffled.slice(0, 10)];
      }
    });

    if (allQuestions.length < 50) {
      return res.status(400).json({ error: 'Not enough questions in banks to generate a 50-item test.' });
    }

    // Save as a special "Day 0" or similar, or a dedicated table. 
    // For now, let's use day_number 100 for General Test.
    const { data, error } = await supabase
      .from('daily_content')
      .upsert([{
        day_number: 100,
        video_title: 'General Test',
        video_description: 'Comprehensive test covering all modules.',
        quiz_questions: allQuestions
      }], { onConflict: 'day_number' })
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'General test generated successfully', test: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Trainee: Quiz Progress API ---
app.get('/api/quiz-progress', async (req, res) => {
  try {
    const userId = req.cookies.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { day } = req.query;
    const { data, error } = await supabase
      .from('quiz_progress')
      .select('*')
      .eq('trainee_id', userId)
      .eq('day_number', day)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    res.json({ progress: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/quiz-progress', async (req, res) => {
  try {
    const userId = req.cookies.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { day_number, videos_completed, time_spent_seconds, quiz_score, quiz_duration_seconds, total_items, is_general_test } = req.body;

    // Check if progress already exists for this day
    const { data: existing, error: fetchError } = await supabase
      .from('quiz_progress')
      .select('id')
      .eq('trainee_id', userId)
      .eq('day_number', day_number)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

    if (existing) {
      // Update existing
      const { error: updateError } = await supabase
        .from('quiz_progress')
        .update({
          videos_completed,
          time_spent_seconds,
          quiz_score,
          quiz_duration_seconds,
          total_items,
          is_general_test,
          created_at: new Date().toISOString()
        })
        .eq('id', existing.id);
      if (updateError) throw updateError;
    } else {
      // Insert new
      const { error: insertError } = await supabase
        .from('quiz_progress')
        .insert([{
          trainee_id: userId,
          day_number,
          videos_completed,
          time_spent_seconds,
          quiz_score,
          quiz_duration_seconds,
          total_items,
          is_general_test
        }]);
      if (insertError) throw insertError;
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/quiz-progress/:batch_id', async (req, res) => {
  try {
    const { batch_id } = req.params;
    if (!supabase) return res.json({ progress: [] });

    // Try with join first
    let { data, error } = await supabase
      .from('quiz_progress')
      .select(`
        *,
        trainee:profiles!inner (
          id,
          username,
          full_name,
          batch_id
        )
      `)
      .eq('trainee.batch_id', batch_id);

    // Fallback if join fails
    if (error && error.code === 'PGRST200') {
      console.log('Get admin quiz progress join failed, using fallback');
      
      const { data: allProgress, error: progressError } = await supabase
        .from('quiz_progress')
        .select('*');
      
      if (progressError) throw progressError;

      // Fetch trainees for this batch
      const { data: trainees, error: traineesError } = await supabase
        .from('profiles')
        .select('id, username, full_name, batch_id')
        .eq('batch_id', batch_id);
      
      if (traineesError) throw traineesError;

      const traineeIds = new Set(trainees.map((t: any) => t.id));
      data = allProgress
        .filter((p: any) => traineeIds.has(p.trainee_id))
        .map((p: any) => ({
          ...p,
          trainee: trainees.find((t: any) => t.id === p.trainee_id) || null
        }));
    } else if (error) {
      throw error;
    }

    res.json({ progress: data });
  } catch (error: any) {
    console.error('Get admin quiz progress error:', JSON.stringify(error));
    res.status(500).json({ error: error.message });
  }
});

// --- Batch Schedules API ---
app.get('/api/admin/batch-schedules/:batch_id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { batch_id } = req.params;
    if (!supabase) return res.json({ schedules: [] });

    const { data, error } = await supabase
      .from('batch_schedules')
      .select('*')
      .eq('batch_id', batch_id)
      .order('day_number', { ascending: true });

    if (error) throw error;
    res.json({ schedules: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/batch-schedules', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { batch_id, schedules } = req.body; // schedules: [{ day_number, scheduled_date }]
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    // First delete existing schedules for the batch to avoid unique constraint issues
    await supabase.from('batch_schedules').delete().eq('batch_id', batch_id);

    // Then insert the new ones
    const newSchedules = schedules.map((s: any) => ({
      batch_id,
      day_number: s.day_number,
      scheduled_date: s.scheduled_date
    }));

    if (newSchedules.length === 0) {
      return res.json({ schedules: [] });
    }

    const { data, error } = await supabase
      .from('batch_schedules')
      .insert(newSchedules)
      .select();

    if (error) throw error;
    res.json({ schedules: data });
  } catch (error: any) {
    console.error('Batch schedules error:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- Vite Integration ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
      
      // Seed Day 1 Content
      const seedDay1 = async () => {
        if (!supabase) return;
        const day1Content = {
          day_number: 1,
          video_title: 'MODULE 1 - Fundamentals - Part 1',
          video_description: 'Introduction to Amazon FBA and Arbitrage fundamentals.',
          video_url: 'https://www.loom.com/share/86c91ed7b0f544189db013325275995f',
          quiz_questions: [
            {
              type: 'mcq',
              question: 'What is Amazon Arbitrage?',
              options: ['Buying low and selling high on Amazon', 'Creating your own brand', 'Dropshipping from China', 'Selling used books only'],
              answer: 'Buying low and selling high on Amazon'
            }
          ]
        };

        const { error } = await supabase
          .from('daily_content')
          .upsert([day1Content], { onConflict: 'day_number' });

        if (error) console.error('Error seeding Day 1:', error.message);
      };
      seedDay1();
    });
  }
}

// Initialize server routes
startServer();

// Export the app for serverless deployment (Vercel)
export default app;
