/* Resident route guard: verify the JWT with the backend before rendering protected data. */
(async function(){
  const session=getSession();
  if(!session?.token){location.replace('index.html?next=member-dashboard.html');return;}
  try{
    const result=await fetchMe();
    const user=result.user||result;
    if(user.role!=='resident'){clearSession();location.replace('index.html');return;}
    document.dispatchEvent(new CustomEvent('member-auth-ready',{detail:{user}}));
  }catch(error){clearSession();location.replace('index.html?expired=1');}
})();
