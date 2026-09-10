import {useEffect,useState} from 'react';
export function usePersistentState<T>(key:string,initial:T){const[s,setS]=useState<T>(()=>{try{const x=localStorage.getItem(key);return x?JSON.parse(x):initial}catch{return initial}});useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(s))}catch{}},[key,s]);return[s,setS] as const}
