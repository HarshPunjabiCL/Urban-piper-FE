export default function PageHeading({ title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 pb-7">
      <div>
        <h1 className="text-[1.75rem] font-semibold leading-tight tracking-tightest text-slate-900">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-slate-600">
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}
