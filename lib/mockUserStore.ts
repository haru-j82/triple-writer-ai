// Mock 사용자 크레딧 시스템
export const mockUsersDb = new Map([
  ['tooissss0919@gmail.com', {
    id: '1',
    email: 'tooissss0919@gmail.com',
    name: 'User',
    subscription_plan: 'starter',
    blog_credits: 100,
    image_credits: 50,
    created_at: new Date().toISOString()
  }]
]);

export const getMockUser = (email: string) => {
  const user = mockUsersDb.get(email);
  if (user) return user;
  
  const newUser = {
    id: Date.now().toString(),
    email,
    name: 'User',
    subscription_plan: 'basic',
    blog_credits: 100,
    image_credits: 50,
    created_at: new Date().toISOString()
  };
  
  mockUsersDb.set(email, newUser);
  return newUser;
};

export const consumeCredit = (email: string, type: 'blog' | 'image', amount: number = 1) => {
  const user = mockUsersDb.get(email);
  if (!user) return false;
  
  if (type === 'blog' && user.blog_credits >= amount) {
    user.blog_credits -= amount;
    return true;
  }
  if (type === 'image' && user.image_credits >= amount) {
    user.image_credits -= amount;
    return true;
  }
  return false;
};

export const getCredits = (email: string) => {
  const user = getMockUser(email);
  return {
    blog_credits: user.blog_credits,
    image_credits: user.image_credits
  };
};
