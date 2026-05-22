function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full mt-auto pt-4 pb-2 border-t border-slate-200">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] font-medium text-slate-500">
        <div>
          {year} © eParivartan - CRM
        </div>

        <div className="flex items-center gap-6">
          <a href="/" className="hover:text-slate-800 transition-colors">About</a>
          <a href="/" className="hover:text-slate-800 transition-colors">Support</a>
          <a href="/" className="hover:text-slate-800 transition-colors">Contact Us</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
